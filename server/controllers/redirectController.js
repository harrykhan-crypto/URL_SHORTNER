const Url = require("../models/Url");
const { isValidCode } = require("../utils/validation");

const notFoundPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Link not found | MakeLink</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px;background:#fff;color:#000}
main{border:4px solid #000;padding:32px;max-width:420px;box-shadow:10px 10px 0 #000}h1{margin:0 0 12px;text-transform:uppercase;font-weight:900}a{color:#000;font-weight:700}</style>
</head><body><main><h1>Link not found</h1><p>This short link doesn't exist or has expired (links last 90 days).</p><p><a href="/">Create a new link →</a></p></main></body></html>`;

const sendNotFound = (res) =>
  res.status(404).type("html").send(notFoundPage);

exports.redirect = async (req, res) => {
  const { code } = req.params;
  if (!isValidCode(code)) return sendNotFound(res);

  try {
    // Atomic increment: concurrent clicks are all counted.
    const url = await Url.findOneAndUpdate(
      { urlCode: code.toLowerCase() },
      { $inc: { clicks: 1 } },
      { projection: { longUrl: 1 } },
    );

    if (!url) return sendNotFound(res);

    res.set("Cache-Control", "no-store");
    return res.redirect(302, url.longUrl);
  } catch (err) {
    console.error("REDIRECT ERROR:", err);
    return res.status(500).type("text").send("Server error. Please try again.");
  }
};
