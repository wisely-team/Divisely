const express = require("express");
const router = express.Router();

const { register, login, logout, forgotPassword } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);

module.exports = router;
