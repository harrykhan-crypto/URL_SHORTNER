const Url = require("../models/Url");
const {
  normalizeUrl,
  normalizeAlias,
  generateCode,
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
