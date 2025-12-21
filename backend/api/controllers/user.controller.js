const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user.model");

async function getMe(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: "unauthorized" });
    }

    const user = await User.findById(userId).select("username email avatar");
    if (!user) {
      return res.status(404).json({ success: false, error: "user_not_found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        avatar: user.avatar || 'avatar-1',
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
    const { username, email, avatar, currentPassword, newPassword } = req.body || {};

    // Valid avatar identifiers (predefined set)
    const VALID_AVATARS = [
      'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5',
      'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'avatar-10',
      'avatar-11', 'avatar-12'
    ];

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

    // Handle avatar update
    if (avatar !== undefined) {
      if (!VALID_AVATARS.includes(avatar)) {
        return res.status(400).json({ success: false, error: "invalid_avatar" });
      }
      user.avatar = avatar;
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
        avatar: user.avatar || 'avatar-1',
        updatedAt: user.updatedAt?.toISOString?.() || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Update me error:", error);
    return res.status(500).json({ success: false, error: "server_error" });
  }
}

async function deleteMe(req, res) {
  try {
    const userId = req.user?.userId;
    const { password } = req.body || {};

    console.log('[DELETE ME] Request body:', req.body);
    console.log('[DELETE ME] Password received:', password ? 'yes (length: ' + password.length + ')' : 'no');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: "unauthorized" });
    }

    if (!password || typeof password !== "string") {
      console.log('[DELETE ME] Password validation failed');
      return res.status(400).json({ success: false, error: "password_required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "user_not_found" });
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "invalid_password" });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log(`[USER DELETED] User ${user.email} (${userId}) has been deleted.`);

    return res.status(200).json({
      success: true,
      data: { message: "Account deleted successfully" }
    });
  } catch (error) {
    console.error("Delete me error:", error);
    return res.status(500).json({ success: false, error: "server_error" });
  }
}

module.exports = { getMe, updateMe, deleteMe };
