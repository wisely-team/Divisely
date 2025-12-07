const mongoose = require("mongoose");

const SettlementSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    from_user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to_user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    settledAt: { type: Date }
}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

module.exports = mongoose.model("Settlement", SettlementSchema);
