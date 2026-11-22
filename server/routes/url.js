const express = require("express");
const router = express.Router();
const { shortenUrl, getStats } = require("../controllers/urlController");

router.post("/shorten", shortenUrl);
router.get("/stats", getStats);

module.exports = router;
