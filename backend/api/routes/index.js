const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.get("/", (req, res) => {
    res.json({
        message: "API root",
        availableRoutes: ["/api/auth/register", "/api/users"]
    });
});

module.exports = router;
