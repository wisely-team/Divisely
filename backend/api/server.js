require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const connectDB = require("./config/db");
const apiRouter = require("./routes");


// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend; allow common local dev ports (3000, 5173) and override via env
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);
if (!allowedOrigins.length) {
    allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

connectDB();

// Main API router
app.use("/api", apiRouter);


// Default Route
app.get("/", (req, res) => {
    res.json({ message: "API çalışıyor!", docs: "/api" });
});

// Server start
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server çalışıyor: http://localhost:${PORT}`);
});
