const express = require("express");
const app = express();
const connectDB = require("./config/db");
const apiRouter = require("./routes");


// Body parser (JSON okumak için)
app.use(express.json());

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



