const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { sendVerificationEmail } = require("../config/email");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";
const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Generate a random 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function register(req, res) {
    try {
        const { email, password, username } = req.body || {};

        if (!email || !password || !username) {
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

        const existingUserName = await User.findOne({ username: username });
        if (existingUserName) {
            return res.status(400).json({
                success: false,
                error: "username_exists"
            });
        }


        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY);

        const user = await User.create({
            email: email.toLowerCase(),
            username,
            passwordHash,
            email_verified: false,
            verification_code: verificationCode,
            verification_code_expires: verificationCodeExpires
        });

        // Send verification email
        await sendVerificationEmail(user.email, user.username, verificationCode);

        return res.status(201).json({
            success: true,
            data: {
                userId: user._id.toString(),
                email: user.email,
                username: user.username,
                createdAt: user.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error("Register error:", error);

        // Mongo duplicate key error
        if (error && (error.code === 11000 || error.codeName === "DuplicateKey")) {
            const dupField = Object.keys(error.keyPattern || error.keyValue || {})[0];
            if (dupField === "email") {
                return res.status(400).json({ success: false, error: "email_exists" });
            }
            if (dupField === "username") {
                return res.status(400).json({ success: false, error: "username_exists" });
            }
            if (dupField === "displayName") {
                return res.status(400).json({ success: false, error: "displayname_exists" });
            }
            return res.status(400).json({ success: false, error: "duplicate_key" });
        }

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

        // Allow login with email or username
        const identifier = email.trim();
        const isEmail = identifier.includes('@');

        let user;
        if (isEmail) {
            user = await User.findOne({ email: identifier.toLowerCase() });
        } else {
            user = await User.findOne({ username: identifier });
        }

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

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                error: "email_not_verified"
            });
        }

        const payload = {
            userId: user._id.toString(),
            username: user.username
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "36500d" });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "36500d" });
        console.log("User logged in:", user._id.toString());
        return res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                expiresIn: 3153600000,
                user: {
                    userId: user._id.toString(),
                    email: user.email,
                    username: user.username
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

async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body || {};

        if (!email || typeof email !== "string" || email.trim() === "") {
            return res.status(400).json({ success: false, error: "missing_email" });
        }

        if (!code || typeof code !== "string" || code.trim() === "") {
            return res.status(400).json({ success: false, error: "missing_code" });
        }

        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ success: false, error: "user_not_found" });
        }

        if (user.email_verified) {
            return res.status(400).json({ success: false, error: "email_already_verified" });
        }

        if (!user.verification_code) {
            return res.status(400).json({ success: false, error: "no_verification_code" });
        }

        const isCodeExpired = new Date() > user.verification_code_expires;
        if (isCodeExpired) {
            return res.status(400).json({ success: false, error: "code_expired" });
        }

        if (user.verification_code !== code.trim()) {
            return res.status(400).json({ success: false, error: "invalid_code" });
        }

        // Code is valid - verify email
        user.email_verified = true;
        user.verification_code = null;
        user.verification_code_expires = null;
        await user.save();

        return res.status(200).json({
            success: true,
            data: { message: "Email verified successfully" }
        });
    } catch (error) {
        console.error("Verify email error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function resendVerificationCode(req, res) {
    try {
        const { email } = req.body || {};

        if (!email || typeof email !== "string" || email.trim() === "") {
            return res.status(400).json({ success: false, error: "missing_email" });
        }

        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ success: false, error: "user_not_found" });
        }

        if (user.email_verified) {
            return res.status(400).json({ success: false, error: "email_already_verified" });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY);

        user.verification_code = verificationCode;
        user.verification_code_expires = verificationCodeExpires;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, user.username, verificationCode);

        return res.status(200).json({
            success: true,
            data: { message: "Verification code sent" }
        });
    } catch (error) {
        console.error("Resend verification code error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body || {};

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: "missing_refresh_token"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        } catch (verifyError) {
            return res.status(401).json({
                success: false,
                error: "invalid_refresh_token"
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "user_not_found"
            });
        }

        const payload = {
            userId: user._id.toString(),
            username: user.username
        };

        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "36500d" });
        const newRefreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "36500d" });

        return res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: 3153600000
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(500).json({
            success: false,
            error: "server_error"
        });
    }
}

module.exports = { register, login, logout, forgotPassword, refreshToken, verifyEmail, resendVerificationCode };
