const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user.model");

async function getMe(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: "unauthorized" });
    }

    const user = await User.findById(userId).select("username email");
    if (!user) {
      return res.status(404).json({ success: false, error: "user_not_found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        updatedAt: user.updatedAt?.toISOString?.() || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ success: false, error: "server_error" });
  }
}

async function updateMe(req, res) {
  try {
    const userId = req.user?.userId;
    const { username, email, currentPassword, newPassword } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: "unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "user_not_found" });
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim() === "") {
        return res.status(400).json({ success: false, error: "invalid_username" });
      }
      const existingName = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
      if (existingName) {
        return res.status(400).json({ success: false, error: "username_exists" });
      }
      user.username = username.trim();
    }

    // Email is not editable - only username can be changed

    if (newPassword !== undefined) {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: "invalid_new_password" });
      }
      if (!currentPassword || typeof currentPassword !== "string") {
        return res.status(400).json({ success: false, error: "current_password_required" });
      }
      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return res.status(401).json({ success: false, error: "invalid_current_password" });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        updatedAt: user.updatedAt?.toISOString?.() || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Update me error:", error);
    return res.status(500).json({ success: false, error: "server_error" });
  }
}

module.exports = { getMe, updateMe };
