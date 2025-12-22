const express = require("express");
const router = express.Router();
const { analyzeFinances, analyzeReceipt } = require("../controllers/gemini.controller");
const authMiddleware = require("../middleware/auth");

// All Gemini routes require authentication
router.post("/analyze-finances", authMiddleware, analyzeFinances);
router.post("/analyze-receipt", authMiddleware, analyzeReceipt);

module.exports = router;
