const express = require("express");
const router = express.Router();

const { createExpense, getGroupExpenses } = require("../controllers/expense.controller");
const authMiddleware = require("../middleware/auth");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/add_expense", authMiddleware, createExpense);
router.get("/get_expenses/:groupId", authMiddleware, getGroupExpenses);

module.exports = router;
