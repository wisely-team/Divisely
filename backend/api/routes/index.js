const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const groupRoutes = require("./group.routes");
const expenseRoutes = require("./expense.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/", expenseRoutes);

router.get("/", (req, res) => {
    res.json({
        message: "API root",
        availableRoutes: ["/api/auth/register", "/api/users", "/api/groups", "/api/add_expense", "/api/get_expenses/:groupId"]
    });
});

module.exports = router;
