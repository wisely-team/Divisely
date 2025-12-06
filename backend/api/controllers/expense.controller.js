const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");

async function createExpense(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId, description, amount, payerId, splits } = req.body || {};
        const paidAt = req.body?.paidAt || req.body?.paid_at || req.body?.["paid at"];
        console.log("Create expense request by user:", requesterId);
        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!groupId || !description || !amount || !payerId || !Array.isArray(splits)) {
            return res.status(400).json({ success: false, error: "missing_fields" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(payerId)) {
            return res.status(400).json({ success: false, error: "invalid_ids" });
        }

        const amountNum = Number(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            return res.status(400).json({ success: false, error: "invalid_amount" });
        }

        const group = await Group.findById(groupId).select("members owner").lean();
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const groupMemberIds = Array.isArray(group.members) ? group.members.map(id => id.toString()) : [];
        const requesterInGroup = groupMemberIds.includes(requesterId);
        if (!requesterInGroup) {
            return res.status(403).json({ success: false, error: "forbidden" });
        }

        if (!groupMemberIds.includes(payerId)) {
            return res.status(400).json({ success: false, error: "payer_not_in_group" });
        }

        const validSplits = splits
            .filter(s => s && typeof s.userId === "string" && mongoose.Types.ObjectId.isValid(s.userId) && Number.isFinite(Number(s.amount)));

        if (!validSplits.length) {
            return res.status(400).json({ success: false, error: "invalid_splits" });
        }

        // Ensure all split users are group members
        for (const split of validSplits) {
            if (!groupMemberIds.includes(split.userId)) {
                return res.status(400).json({ success: false, error: "split_user_not_in_group" });
            }
        }

        const totalSplit = validSplits.reduce((sum, s) => sum + Number(s.amount), 0);
        if (Math.abs(totalSplit - amountNum) > 0.01) {
            return res.status(400).json({ success: false, error: "split_total_mismatch" });
        }

        const splitUserIds = validSplits.map(s => s.userId);
        const userDocs = await User.find({ _id: { $in: Array.from(new Set([payerId, ...splitUserIds])) } }).select("displayName email");
        const payer = userDocs.find(u => u._id.toString() === payerId);

        const expense = await Expense.create({
            group: groupId,
            paid_by: payerId,
            description: description.trim(),
            amount: amountNum,
            paid_time: paidAt ? new Date(paidAt) : undefined,
            debtors: validSplits.map(s => ({
                user: s.userId,
                amount: Number(s.amount)
            }))
        });

        const responseSplits = validSplits.map(s => {
            const user = userDocs.find(u => u._id.toString() === s.userId);
            return {
                userId: s.userId,
                displayName: user?.displayName || user?.email,
                amount: Number(s.amount)
            };
        });
        

        return res.status(201).json({
            success: true,
            data: {
                expenseId: expense._id.toString(),
                groupId: groupId,
                description: expense.description,
                amount: expense.amount,
                payerId: payerId,
                payerName: payer?.displayName || payer?.email,
                splits: responseSplits,
                createdAt: expense.createdAt?.toISOString()
            }
        });
    } catch (error) {
        console.error("Create expense error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function getGroupExpenses(req, res) {
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

        const groupMemberIds = Array.isArray(group.members) ? group.members.map(id => id.toString()) : [];
        if (!groupMemberIds.includes(requesterId)) {
            return res.status(403).json({ success: false, error: "forbidden" });
        }

        const expenses = await Expense.find({ group: groupId })
            .sort({ paid_time: -1, createdAt: -1 })
            .lean();

        const userIds = new Set();
        expenses.forEach(expense => {
            if (expense.paid_by) userIds.add(expense.paid_by.toString());
            (expense.debtors || []).forEach(d => d?.user && userIds.add(d.user.toString()));
        });

        const users = await User.find({ _id: { $in: Array.from(userIds) } })
            .select("displayName email")
            .lean();

        const getUserName = (userId) => {
            const user = users.find(u => u._id.toString() === userId);
            return user?.displayName || user?.email || "Unknown";
        };

        const data = expenses.map(expense => {
            const payerId = expense.paid_by?.toString();
            const payerName = payerId ? getUserName(payerId) : undefined;
            const splitForRequester = (expense.debtors || []).find(d => d.user?.toString() === requesterId);
            const requesterSplitAmount = splitForRequester ? Number(splitForRequester.amount) : 0;
            const amount = Number(expense.amount) || 0;
            const isBorrow = payerId !== requesterId;
            const myShare = requesterSplitAmount;

            return {
                expenseId: expense._id.toString(),
                description: expense.description,
                amount,
                payerId,
                payerName,
                my_share: myShare,
                is_borrow: isBorrow,
                createdAt: expense.createdAt ? expense.createdAt.toISOString() : undefined,
                paidTime: expense.paid_time ? expense.paid_time.toISOString() : undefined
            };
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Get expenses error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

module.exports = { createExpense, getGroupExpenses };
