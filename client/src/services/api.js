import axios from "axios";

// In production the site proxies /api to the API server (see vercel.json),
// so a relative path works. Locally, talk to the dev server directly.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const API = axios.create({
  baseURL,
  // Render's free tier can take ~50s to wake from sleep.
  timeout: 60000,
});

const errorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.status === 429)
    return "Too many requests. Please wait a few minutes and try again.";
  if (error.code === "ECONNABORTED")
    return "The server took too long to respond. Please try again.";
  return "Can't reach the server. Check your connection and try again.";
};

export const shortenUrl = async (longUrl, customCode) => {
  try {
    const response = await API.post("/url/shorten", { longUrl, customCode });
    return response.data;
  } catch (error) {
    throw new Error(errorMessage(error));
  }
};

/** Click counts for up to 50 codes. Codes that no longer exist are omitted. */
export const getStats = async (codes) => {
  if (codes.length === 0) return [];
  const response = await API.get("/url/stats", {
    params: { codes: codes.slice(0, 50).join(",") },
    timeout: 20000,
  });
  return response.data;
};

/** Resolves true once the API (and its database) answers, false on failure. */
export const pingServer = async () => {
  try {
    await API.get("/ping", { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
};
