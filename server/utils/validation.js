const crypto = require("crypto");

const MAX_URL_LENGTH = 2048;
const CODE_ALPHABET =
  "abcdefghijklmnopqrstuvwxyz0123456789";
const RANDOM_CODE_LENGTH = 7;
const ALIAS_PATTERN = /^[a-z0-9_-]{3,32}$/;
const CODE_PATTERN = /^[a-z0-9_-]{1,32}$/;

// Paths the frontend or API already use; an alias with one of these names
// would never be reachable or would shadow a real file.
const RESERVED_CODES = new Set([
  "api",
  "assets",
  "index",
  "index-html",
  "favicon",
  "robots",
  "sitemap",
  "og-image",
  "cover",
  "vite",
  "admin",
  "login",
  "static",
]);

/**
 * Normalize and validate a destination URL.
 * Returns { url } on success or { error } with a user-facing message.
 */
const normalizeUrl = (raw, ownHost) => {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { error: "URL is required" };
  }

  let candidate = raw.trim();
  if (candidate.length > MAX_URL_LENGTH) {
    return { error: "URL is too long" };
  }

  if (!/^https?:\/\//i.test(candidate)) {
    // Something like "ftp://", "javascript:", "data:" — a scheme that is not
    // followed by a port number. Reject instead of mangling it.
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(candidate)) {
      return { error: "Only http and https links can be shortened" };
    }
    candidate = `https://${candidate}`;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return { error: "That doesn't look like a valid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only http and https links can be shortened" };
  }
  if (parsed.username || parsed.password) {
    return { error: "URLs with embedded credentials are not allowed" };
  }
  // Require a real public-looking host: "example.com", not "localhost" or "foo".
  const host = parsed.hostname;
  const isIpv6 = host.startsWith("[");
  if (!isIpv6 && (!host.includes(".") || host.endsWith("."))) {
    return { error: "That doesn't look like a valid URL" };
  }
  if (ownHost && host.toLowerCase() === ownHost.toLowerCase()) {
    return { error: "That link is already a MakeLink short link" };
  }

  return { url: parsed.href };
};

/**
 * Validate an optional custom alias.
 * Returns { code: null } when no alias was given.
 */
const normalizeAlias = (raw) => {
  if (raw === undefined || raw === null) return { code: null };
  if (typeof raw !== "string") return { error: "Alias must be text" };

  const code = raw.trim().toLowerCase();
  if (code === "") return { code: null };

  if (!ALIAS_PATTERN.test(code)) {
    return {
      error:
        "Alias must be 3–32 characters: letters, numbers, hyphens or underscores",
    };
  }
  if (RESERVED_CODES.has(code)) {
    return { error: "That alias is reserved. Please pick another." };
  }
  return { code };
};

const generateCode = () => {
  let code = "";
  for (let i = 0; i < RANDOM_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
};

const isValidCode = (code) =>
  typeof code === "string" && CODE_PATTERN.test(code.toLowerCase());

module.exports = {
  normalizeUrl,
  normalizeAlias,
  generateCode,
  isValidCode,
  RESERVED_CODES,
};
