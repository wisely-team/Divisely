const express = require("express");
const router = express.Router();

const { register, login, logout, forgotPassword, refreshToken, verifyEmail, resendVerificationCode } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/refresh-token", refreshToken);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-code", resendVerificationCode);

module.exports = router;
