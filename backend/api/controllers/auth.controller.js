const bcrypt = require("bcrypt");
const User = require("../models/user.model");

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

module.exports = { register };
