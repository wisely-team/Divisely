const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: 'avatar-1' },
    email_verified: { type: Boolean, required: true, default: false },
    verification_code: { type: String, default: null },
    verification_code_expires: { type: Date, default: null },
    password_reset_code: { type: String, default: null },
    password_reset_expires: { type: Date, default: null }


}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

module.exports = mongoose.model("User", UserSchema);

