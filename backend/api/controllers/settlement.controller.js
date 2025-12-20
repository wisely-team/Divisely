const mongoose = require("mongoose");
const Settlement = require("../models/settlement.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");

async function createSettlement(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId, fromUserId, toUserId, amount, description, settledAt, createdAt } = req.body || {};

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!groupId || !fromUserId || !toUserId || !amount) {
            return res.status(400).json({ success: false, error: "missing_fields" });
        }

        if (
            !mongoose.Types.ObjectId.isValid(groupId) ||
            !mongoose.Types.ObjectId.isValid(fromUserId) ||
            !mongoose.Types.ObjectId.isValid(toUserId)
        ) {
            return res.status(400).json({ success: false, error: "invalid_ids" });
        }

        const amountNum = Number(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            return res.status(400).json({ success: false, error: "invalid_amount" });
        }

        const group = await Group.findById(groupId).select("members memberBalances");
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const memberIds = Array.isArray(group.members) ? group.members.map(m => (m.user || m).toString()) : [];
        if (!memberIds.includes(requesterId)) {
            return res.status(403).json({ success: false, error: "You are not authorized to create a settlement in this group" });
        }

        if (!memberIds.includes(fromUserId) || !memberIds.includes(toUserId)) {
            return res.status(400).json({ success: false, error: "users_not_in_group" });
        }

        const users = await User.find({ _id: { $in: [fromUserId, toUserId] } }).select("displayName email");
        const fromUserDoc = users.find(u => u._id.toString() === fromUserId);
        const toUserDoc = users.find(u => u._id.toString() === toUserId);

        const settlement = await Settlement.create({
            group: groupId,
            from_user: fromUserId,
            to_user: toUserId,
            amount: amountNum,
            description: typeof description === "string" ? description.trim() : undefined,
            settledAt: settledAt ? new Date(settledAt) : undefined
        });

        const balanceUpdates = new Map();
        balanceUpdates.set(fromUserId, (balanceUpdates.get(fromUserId) || 0) + amountNum);
        balanceUpdates.set(toUserId, (balanceUpdates.get(toUserId) || 0) - amountNum);

        const currentBalances = new Map();
        (group.memberBalances || []).forEach(entry => {
            if (!entry?.userId) return;
            currentBalances.set(entry.userId.toString(), Number(entry.balance) || 0);
        });

        memberIds.forEach(id => {
            if (!currentBalances.has(id)) {
                currentBalances.set(id, 0);
            }
        });

        for (const [userId, delta] of balanceUpdates.entries()) {
            const existing = currentBalances.get(userId) || 0;
            currentBalances.set(userId, existing + delta);
        }

        group.memberBalances = Array.from(currentBalances.entries()).map(([userId, balance]) => ({ userId, balance }));
        await group.save();

        return res.status(201).json({
            success: true,
            data: {
                settlementId: settlement._id.toString(),
                groupId,
                fromUserId,
                toUserId,
                amount: settlement.amount,
                note: settlement.description,
                createdAt: settlement.createdAt.toISOString(),
                settledAt: settlement.settledAt ? settlement.settledAt.toISOString() : undefined,
                fromUserName: fromUserDoc?.displayName || fromUserDoc?.email,
                toUserName: toUserDoc?.displayName || toUserDoc?.email
            }
        });
    } catch (error) {
        console.error("Create settlement error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function getSettlements(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        const group = await Group.findById(groupId).select("members").lean();
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const memberIds = Array.isArray(group.members) ? group.members.map(m => (m.user || m).toString()) : [];
        if (!memberIds.includes(requesterId)) {
            return res.status(403).json({ success: false, error: "You are not authorized to view settlements in this group" });
        }

        const settlements = await Settlement.find({ group: groupId })
            .sort({ settledAt: -1, createdAt: -1 })
            .lean();

        const data = settlements.map(s => ({
            settlementId: s._id.toString(),
            fromUserId: s.from_user?.toString(),
            toUserId: s.to_user?.toString(),
            amount: Number(s.amount) || 0,
            note: s.description,
            settledAt: s.settledAt ? s.settledAt.toISOString() : undefined,
            createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString()
        }));

        return res.status(200).json({
            success: true,
            data: {
                groupId,
                settlements: data
            }
        });
    } catch (error) {
        console.error("Get settlements error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function deleteSettlement(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { settlementId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!settlementId || !mongoose.Types.ObjectId.isValid(settlementId)) {
            return res.status(400).json({ success: false, error: "invalid_settlement_id" });
        }

        const settlement = await Settlement.findById(settlementId);
        if (!settlement) {
            return res.status(404).json({ success: false, error: "settlement_not_found" });
        }

        const groupId = settlement.group?.toString();
        if (!groupId) {
            return res.status(400).json({ success: false, error: "settlement_group_missing" });
        }

        const group = await Group.findById(groupId).select("owner members memberBalances");
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const isGroupOwner = group.owner?.toString() === requesterId;
        const isPayer = settlement.from_user?.toString() === requesterId;
        if (!isGroupOwner && !isPayer) {
            return res.status(403).json({ success: false, error: "You are not authorized to delete this settlement" });
        }

        const memberIds = Array.isArray(group.members) ? group.members.map(m => (m.user || m).toString()) : [];
        if (!memberIds.includes(requesterId)) {
            return res.status(403).json({ success: false, error: "You are not authorized to delete this settlement" });
        }

        const balanceUpdates = new Map();
        const amountNum = Number(settlement.amount) || 0;
        const fromId = settlement.from_user?.toString();
        const toId = settlement.to_user?.toString();
        if (fromId) balanceUpdates.set(fromId, (balanceUpdates.get(fromId) || 0) - amountNum);
        if (toId) balanceUpdates.set(toId, (balanceUpdates.get(toId) || 0) + amountNum);

        const currentBalances = new Map();
        (group.memberBalances || []).forEach(entry => {
            if (!entry?.userId) return;
            currentBalances.set(entry.userId.toString(), Number(entry.balance) || 0);
        });

        memberIds.forEach(id => {
            if (!currentBalances.has(id)) currentBalances.set(id, 0);
        });

        for (const [userId, delta] of balanceUpdates.entries()) {
            const existing = currentBalances.get(userId) || 0;
            currentBalances.set(userId, existing + delta);
        }

        group.memberBalances = Array.from(currentBalances.entries()).map(([userId, balance]) => ({ userId, balance }));
        await group.save();
        await settlement.deleteOne();

        return res.status(200).json({ success: true, message: "Settlement deleted successfully" });
    } catch (error) {
        console.error("Delete settlement error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

module.exports = { createSettlement, getSettlements, deleteSettlement };
