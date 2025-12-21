const mongoose = require("mongoose");

async function connectDB() {
    try {
        const mongoUri = process.env.MONGODB_URI; // || "mongodb://127.0.0.1:27017/mydb" for local fallback
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");

        // Backward-compat: older DBs may have a unique index on users.displayName
        // which treats missing values as null and breaks registration.
        try {
            const User = require("../models/user.model");
            const indexes = await User.collection.indexes();
            const hasLegacyDisplayNameIndex = indexes.some(i => i?.name === "displayName_1");
            if (hasLegacyDisplayNameIndex) {
                await User.collection.dropIndex("displayName_1");
            }
            // Ensure schema indexes (including partial unique displayName) exist.
            await User.createIndexes();
        } catch (indexError) {
            // Non-fatal: app can run, but registration may still fail until indexes are fixed.
            console.warn("User index maintenance skipped/failed:", indexError?.message || indexError);
        }
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

module.exports = connectDB;
