const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/mydb");
        console.log("MongoDB bağlantısı başarılı");
    } catch (err) {
        console.error("MongoDB bağlantı hatası:", err);
        process.exit(1);
    }
}

module.exports = connectDB;
