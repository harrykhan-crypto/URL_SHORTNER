const Url = require("../models/Url");
const {
  normalizeUrl,
  normalizeAlias,
  generateCode,
  isValidCode,
} = require("../utils/validation");

const MAX_GENERATION_ATTEMPTS = 5;

const isDuplicateKeyError = (err) => err && err.code === 11000;

const getBaseUrl = (req) =>
  (process.env.BASE_URL || `${req.protocol}://${req.get("host")}`).replace(
    /\/+$/,
    "",
  );

exports.shortenUrl = async (req, res) => {
  try {
    const body = req.body || {};
    const baseUrl = getBaseUrl(req);

    let ownHost = null;
    try {
      ownHost = new URL(baseUrl).hostname;
    } catch {
      /* ignore malformed BASE_URL; it only disables the loop check */
    }

    const { url: longUrl, error: urlError } = normalizeUrl(
      body.longUrl,
      ownHost,
    );
    if (urlError) return res.status(400).json({ message: urlError });

    const { code: alias, error: aliasError } = normalizeAlias(body.customCode);
    if (aliasError) return res.status(400).json({ message: aliasError });

    if (alias) {
      try {
        const saved = await Url.create({
          longUrl,
          urlCode: alias,
          shortUrl: `${baseUrl}/${alias}`,
        });
        return res.status(201).json(saved);
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          return res
            .status(409)
            .json({ message: "That alias is already taken" });
        }
        throw err;
      }
    }

    // Random code: retry on the (rare) collision instead of failing.
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const urlCode = generateCode();
      try {
        const saved = await Url.create({
          longUrl,
          urlCode,
          shortUrl: `${baseUrl}/${urlCode}`,
        });
        return res.status(201).json(saved);
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }

    throw new Error("Could not generate a unique code");
  } catch (err) {
    console.error("SHORTEN ERROR:", err);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

const MAX_STATS_CODES = 50;
const LINK_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

// GET /api/url/stats?codes=abc,def  ->  click counts for links the browser
// remembers creating. Returns only codes that still exist.
exports.getStats = async (req, res) => {
  try {
    const raw = typeof req.query.codes === "string" ? req.query.codes : "";
    const codes = [
      ...new Set(
        raw
          .split(",")
          .map((c) => c.trim().toLowerCase())
          .filter((c) => isValidCode(c)),
      ),
    ];

    if (codes.length === 0) {
      return res.status(400).json({ message: "No valid codes given" });
    }
    if (codes.length > MAX_STATS_CODES) {
      return res
        .status(400)
        .json({ message: `At most ${MAX_STATS_CODES} codes per request` });
    }

    const docs = await Url.find(
      { urlCode: { $in: codes } },
      { _id: 0, urlCode: 1, clicks: 1, createdAt: 1 },
    ).lean();

    return res.status(200).json(
      docs.map((d) => ({
        urlCode: d.urlCode,
        clicks: d.clicks,
        createdAt: d.createdAt,
        expiresAt: new Date(
          new Date(d.createdAt).getTime() + LINK_LIFETIME_MS,
        ),
      })),
    );
  } catch (err) {
    console.error("STATS ERROR:", err);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};
