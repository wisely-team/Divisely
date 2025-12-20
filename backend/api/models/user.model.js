const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, unique: true },
    // Optional public-facing name.
    // NOTE: We intentionally do NOT default to null; older DBs may have a unique
    // index on displayName which treats missing values as null.
    displayName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    email_verified: { type: Boolean, required: true, default: false },
    verification_code: { type: String, default: null },
    verification_code_expires: { type: Date, default: null }

}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

// Enforce uniqueness only when displayName is actually present as a string.
// This avoids E11000 dup key on { displayName: null } for users without a displayName.
UserSchema.index(
    { displayName: 1 },
    { unique: true, partialFilterExpression: { displayName: { $type: "string" } } }
);

module.exports = mongoose.model("User", UserSchema);

