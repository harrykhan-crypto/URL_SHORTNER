// Links this browser created, so people can find them again. Stored only in
// this browser; nothing here is sent anywhere except the codes for click counts.
const KEY = "makelink:recent";
const MAX_ITEMS = 20;

export const loadHistory = () => {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(items)
      ? items.filter((i) => i && i.urlCode && i.shortUrl && i.longUrl)
      : [];
  } catch {
    return [];
  }
};

export const saveHistory = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* storage full or unavailable: history just won't persist */
  }
};

export const addToHistory = (items, link) => {
  const entry = {
    urlCode: link.urlCode,
    shortUrl: link.shortUrl,
    longUrl: link.longUrl,
    createdAt: link.createdAt || new Date().toISOString(),
  };
  return [entry, ...items.filter((i) => i.urlCode !== entry.urlCode)].slice(
    0,
    MAX_ITEMS,
  );
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const LINK_LIFETIME_DAYS = 90;

export const expiryDate = (createdAt) =>
  new Date(new Date(createdAt).getTime() + LINK_LIFETIME_DAYS * DAY_MS);

export const daysLeft = (createdAt) =>
  Math.max(0, Math.ceil((expiryDate(createdAt) - Date.now()) / DAY_MS));

export const displayUrl = (url) => url.replace(/^https?:\/\//, "");
