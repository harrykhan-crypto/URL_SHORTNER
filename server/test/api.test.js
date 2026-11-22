process.env.NODE_ENV = "test";
process.env.BASE_URL = "https://make-link.vercel.app";

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const Url = require("../models/Url");
const app = require("../app");

// In-memory stand-in for the Mongo collection, enforcing the unique index.
let store;
const dupError = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000 });

beforeEach(() => {
  store = new Map();
  Url.create = async (doc) => {
    if (store.has(doc.urlCode)) throw dupError();
    const saved = { ...doc, clicks: 0, createdAt: new Date() };
    store.set(doc.urlCode, saved);
    return saved;
  };
  Url.findOneAndUpdate = async (filter, update) => {
    const doc = store.get(filter.urlCode);
    if (!doc) return null;
    const before = { ...doc };
    doc.clicks += update.$inc.clicks;
    return before;
  };
});

const shorten = (body) => request(app).post("/api/url/shorten").send(body);

test("missing URL returns 400, not 500", async () => {
  const res = await shorten({});
  assert.equal(res.status, 400);
  assert.equal(res.body.message, "URL is required");
});

test("non-string URL returns 400", async () => {
  const res = await shorten({ longUrl: { $gt: "" } });
  assert.equal(res.status, 400);
});

test("bare domain gets https:// and a 7-char code", async () => {
  const res = await shorten({ longUrl: "example.com/path?q=1" });
  assert.equal(res.status, 201);
  assert.equal(res.body.longUrl, "https://example.com/path?q=1");
  assert.match(res.body.urlCode, /^[a-z0-9]{7}$/);
  assert.equal(res.body.shortUrl, `https://make-link.vercel.app/${res.body.urlCode}`);
});

test("host with port is not mistaken for a scheme", async () => {
  const res = await shorten({ longUrl: "example.com:8080/x" });
  assert.equal(res.status, 201);
  assert.equal(res.body.longUrl, "https://example.com:8080/x");
});

for (const bad of [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "data:text/html,hi",
  "ftp://example.com",
  "file:///etc/passwd",
  "httpfoo",
  "localhost",
  "https://user:pass@example.com",
  "https://make-link.vercel.app/abc",
]) {
  test(`rejects ${bad}`, async () => {
    const res = await shorten({ longUrl: bad });
    assert.equal(res.status, 400, JSON.stringify(res.body));
  });
}

test("custom alias works and is lowercased", async () => {
  const res = await shorten({ longUrl: "https://example.com", customCode: "  Sale-2026 " });
  assert.equal(res.status, 201);
  assert.equal(res.body.urlCode, "sale-2026");
});

test("taken alias returns 409 (even when the insert races)", async () => {
  await shorten({ longUrl: "https://example.com", customCode: "taken" });
  const res = await shorten({ longUrl: "https://other.com", customCode: "taken" });
  assert.equal(res.status, 409);
});

test("invalid / reserved aliases return 400", async () => {
  for (const customCode of ["!!!", "ab", "a".repeat(33), "has space", "api", 42]) {
    const res = await shorten({ longUrl: "https://example.com", customCode });
    assert.equal(res.status, 400, `alias ${customCode}`);
  }
});

test("empty alias falls back to random code", async () => {
  const res = await shorten({ longUrl: "https://example.com", customCode: "   " });
  assert.equal(res.status, 201);
  assert.match(res.body.urlCode, /^[a-z0-9]{7}$/);
});

test("random-code collision is retried", async () => {
  const realCreate = Url.create;
  let calls = 0;
  Url.create = async (doc) => {
    calls++;
    if (calls === 1) throw dupError();
    return realCreate(doc);
  };
  const res = await shorten({ longUrl: "https://example.com" });
  assert.equal(res.status, 201);
  assert.equal(calls, 2);
});

test("database errors don't leak details", async () => {
  Url.create = async () => {
    throw new Error("secret connection string mongodb+srv://x");
  };
  const res = await shorten({ longUrl: "https://example.com" });
  assert.equal(res.status, 500);
  assert.doesNotMatch(JSON.stringify(res.body), /mongodb/);
});

test("malformed JSON returns 400", async () => {
  const res = await request(app)
    .post("/api/url/shorten")
    .set("Content-Type", "application/json")
    .send("{bad json");
  assert.equal(res.status, 400);
});

test("redirect sends 302 and counts every click", async () => {
  const created = await shorten({ longUrl: "https://example.com", customCode: "golink" });
  assert.equal(created.status, 201);

  const results = await Promise.all([1, 2, 3].map(() => request(app).get("/golink")));
  for (const r of results) {
    assert.equal(r.status, 302);
    assert.equal(r.headers.location, "https://example.com/");
  }
  assert.equal(store.get("golink").clicks, 3);

  const upper = await request(app).get("/GoLink");
  assert.equal(upper.status, 302);
});

test("unknown code returns friendly 404 page", async () => {
  const res = await request(app).get("/nope123");
  assert.equal(res.status, 404);
  assert.match(res.text, /Link not found/);
});

test("unknown /api route is a JSON 404, not a redirect lookup", async () => {
  let looked = false;
  Url.findOneAndUpdate = async () => {
    looked = true;
    return null;
  };
  const res = await request(app).get("/api/whatever");
  assert.equal(res.status, 404);
  assert.equal(looked, false);
});

test("ping returns 503 when DB is not connected and has CORS headers", async () => {
  const res = await request(app).get("/api/ping").set("Origin", "https://x.com");
  assert.equal(res.status, 503);
  assert.equal(res.headers["access-control-allow-origin"], "*");
});

test("rate limiter keys on the client IP behind a proxy", async () => {
  const a = await shorten({}).set("X-Forwarded-For", "1.1.1.1");
  const b = await shorten({}).set("X-Forwarded-For", "2.2.2.2");
  // Each client has its own bucket, so remaining counts are independent.
  const remaining = (r) => r.headers["ratelimit"];
  assert.ok(remaining(a) && remaining(b));
  assert.equal(remaining(a), remaining(b));
});
