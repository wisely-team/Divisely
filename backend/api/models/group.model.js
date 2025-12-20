const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        displayName: { type: String, required: true, trim: true }
    }],
    memberBalances: {
        type: [
            {
                _id: false,
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                balance: { type: Number, default: 0 }
            }
        ],
        default: []
    }

}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

module.exports = mongoose.model("Group", GroupSchema);
