const mongoose = require("mongoose");

async function connectDB() {
    try {
        const mongoUri = process.env.MONGODB_URI; // || "mongodb://127.0.0.1:27017/mydb" for local fallback
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

module.exports = connectDB;
