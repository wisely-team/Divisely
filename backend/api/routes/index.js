const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const groupRoutes = require("./group.routes");
const expenseRoutes = require("./expense.routes");
const settlementRoutes = require("./settlement.routes");
const activityRoutes = require("./activity.routes");
const geminiRoutes = require("./gemini.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/", expenseRoutes);
router.use("/", settlementRoutes);
router.use("/", activityRoutes);
router.use("/gemini", geminiRoutes);

router.get("/", (req, res) => {
    res.json({
        message: "API root",
        availableRoutes: ["/api/auth/register", "/api/users", "/api/groups", "/api/add_expense", "/api/get_expenses/:groupId", "/api/get_expense/:expenseId", "/api/settlements", "/api/settlement/:settlementId"]
    });
});

module.exports = router;
