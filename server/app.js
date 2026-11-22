const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const app = express();

// Render (and Vercel rewrites in front of it) put proxies between the client
// and this app. Without this, req.ip is the proxy's IP and every visitor
// shares one rate-limit bucket. Set TRUST_PROXY=2 when traffic arrives via
// Vercel rewrites -> Render.
const trustProxy = Number(process.env.TRUST_PROXY ?? 1);
app.set("trust proxy", Number.isNaN(trustProxy) ? 1 : trustProxy);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json({ limit: "10kb" }));

if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many requests. Please try again later.",
});

// Health check. Touches the database so a keep-alive ping also keeps the
// MongoDB connection (and Atlas cluster) active.
app.get("/api/ping", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("not connected");
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: "ready", message: "Server is awake" });
  } catch {
    res.status(503).json({ status: "degraded", message: "Database unavailable" });
  }
});

app.use("/api", apiLimiter);
app.use("/api/url", require("./routes/url"));

// Unknown API routes should not fall through to the redirect handler.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "MakeLink API" });
});

app.use("/", redirectLimiter, require("./routes/redirect"));

// Malformed JSON bodies, oversized payloads, and anything unexpected.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

module.exports = app;
