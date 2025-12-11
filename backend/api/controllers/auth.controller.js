const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";

async function register(req, res) {
    try {
        const { email, password, displayName } = req.body || {};

        if (!email || !password || !displayName) {
            return res.status(400).json({
                success: false,
                error: "missing_fields"
            });
        }

        const existingUserEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserEmail) {
            return res.status(400).json({
                success: false,
                error: "email_exists"
            });
        }

        const existingUserName = await User.findOne({ displayName: displayName });
        if (existingUserName) {
            return res.status(400).json({
                success: false,
                error: "displayName_exists"
            });
        }
        

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: email.toLowerCase(),
            displayName,
            passwordHash,
            email_verified: false
        });

        return res.status(201).json({
            success: true,
            data: {
                userId: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            error: "server_error"
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "missing_fields"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "invalid_credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "invalid_credentials"
            });
        }

        const payload = {
            userId: user._id.toString(),
            username: user.displayName
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
        console.log("User logged in:", user._id.toString());
        return res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                expiresIn: 3600,
                user: {
                    userId: user._id.toString(),
                    email: user.email,
                    displayName: user.displayName
                }
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error, please try again later."
        });
    }
}

async function logout(req, res) {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Please sign in again."
            });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (verifyError) {
            return res.status(401).json({
                success: false,
                error: "Please sign in again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully logged out"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error, please try again later."
        });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body || {};

        if (!email || typeof email !== "string" || email.trim() === "") {
            return res.status(400).json({ success: false, error: "Missing email" });
        }

        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select("_id email");

        if (!user) {
            return res.status(200).json({ success: false, data: { message: "No user found with that email." } });
        }

        // TODO: Generate a reset token and send email when email infrastructure is ready.

        return res.status(200).json({ success: true, data: { message: "Reset instructions sent." } });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, error: "Server error, please try again later." });
    }
}

module.exports = { register, login, logout, forgotPassword };
