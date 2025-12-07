const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    memberBalances: {
        type: [
            {
                _id: false,
                id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                balance: { type: Number, default: 0 }
            }
        ],
        default: []
    }
}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

module.exports = mongoose.model("Group", GroupSchema);
