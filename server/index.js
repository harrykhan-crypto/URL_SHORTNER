const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const app = require("./app");

if (!process.env.BASE_URL) {
  console.warn(
    "⚠️  BASE_URL is not set. Short links will use the request host, which is wrong behind a proxy (e.g. Vercel rewrites).",
  );
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
  });
});
