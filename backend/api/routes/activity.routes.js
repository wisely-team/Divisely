const express = require("express");
const router = express.Router();

const { getRecentActivities } = require("../controllers/activity.controller");
const authMiddleware = require("../middleware/auth");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/activities", authMiddleware, getRecentActivities);

module.exports = router;
