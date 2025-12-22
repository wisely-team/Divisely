const express = require("express");
const router = express.Router();

const { createExpense, getGroupExpenses, getExpense, deleteExpense, updateExpense } = require("../controllers/expense.controller");
const authMiddleware = require("../middleware/auth");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/add_expense", authMiddleware, createExpense);
router.get("/get_expenses/:groupId", authMiddleware, getGroupExpenses);
router.get("/get_expense/:expenseId", authMiddleware, getExpense);
router.delete("/expenses/:expenseId", authMiddleware, deleteExpense);
router.put("/expenses/:expenseId", authMiddleware, updateExpense);

module.exports = router;
