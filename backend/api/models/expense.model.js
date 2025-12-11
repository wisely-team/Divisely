const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    paid_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paid_time: { type: Date },
    debtors: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            amount: { type: Number, required: true }
        }
    ]
}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

module.exports = mongoose.model("Expense", ExpenseSchema);
