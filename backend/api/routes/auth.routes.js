const express = require("express");
const router = express.Router();

const { register, login, logout, forgotPassword, refreshToken } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/refresh-token", refreshToken);

module.exports = router;
