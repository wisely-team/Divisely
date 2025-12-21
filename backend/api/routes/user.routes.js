const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getMe, updateMe, deleteMe } = require("../controllers/user.controller");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.delete("/me", authMiddleware, deleteMe);

module.exports = router;
