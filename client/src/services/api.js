import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  // Render's free tier can take ~50s to wake from sleep.
  timeout: 60000,
});

const errorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.status === 429)
    return "Too many requests. Please try again later.";
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

/** Resolves true once the API (and its database) answers, false on failure. */
export const pingServer = async () => {
  try {
    await API.get("/ping", { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
};
