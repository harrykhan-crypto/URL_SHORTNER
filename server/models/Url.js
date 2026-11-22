const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  urlCode: { type: String, required: true, unique: true },
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
  clicks: { type: Number, required: true, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL index: MongoDB deletes the document 90 days after creation.
    index: { expires: "90d" },
  },
});

module.exports = mongoose.model("Url", UrlSchema);
