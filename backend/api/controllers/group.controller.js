const mongoose = require("mongoose");
const Group = require("../models/group.model");
const User = require("../models/user.model");
const Expense = require("../models/expense.model");
const Settlement = require("../models/settlement.model");

async function createGroup(req, res) {
    try {
        const ownerId = req.user?.userId;
        console.log("ownerId:", ownerId);
        console.log("Request body:", req.body);
        console.log("name:", req.body?.name);
        //console.log("Request headers:", req.headers);

        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
        const members = Array.isArray(req.body?.members) ? req.body.members : [];

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: "unauthorized"
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                error: "missing_fieldscvx",
                message: "Group name is required"
            });
        }

        const owner = await User.findById(ownerId).select("displayName email");
        if (!owner) {
            return res.status(401).json({
                success: false,
                error: "user_not_found"
            });
        }

        const validMemberIds = members
            .filter(id => typeof id === "string" && mongoose.Types.ObjectId.isValid(id));

        // Ensure owner is part of the group members
        const uniqueMemberIds = Array.from(new Set([ownerId, ...validMemberIds]));

        const memberUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select("displayName email");
        const memberBalances = memberUsers.map(u => ({ id: u._id, balance: 0 }));

        const group = await Group.create({
            name,
            description,
            owner: owner._id,
            members: memberUsers.map(u => u._id),
            memberBalances
        });

        const responseMembers = memberUsers.map(u => ({
            userId: u._id.toString(),
            displayName: u.displayName,
            email: u.email
        }));
        const responseMemberBalances = memberBalances.map(mb => ({
            id: mb.id.toString(),
            balance: mb.balance
        }));

        return res.status(201).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                name: group.name,
                description: group.description,
                createdBy: owner._id.toString(),
                members: responseMembers,
                memberBalances: responseMemberBalances,
                createdAt: group.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error("Create group error:", error);
        return res.status(500).json({
            success: false,
            error: "server_error"
        });
    }
}

async function getUserGroups(req, res) {
    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                error: "unauthorized"
            });
        }

        const groups = await Group.find({ members: userId })
            .populate("members", "displayName email")
            .sort({ updatedAt: -1 })
            .lean();

        const response = groups.map(group => ({
            groupId: group._id.toString(),
            name: group.name,
            description: group.description,
            memberCount: Array.isArray(group.members) ? group.members.length : 0,
            members: (group.members || []).map(member => ({
                userId: member._id.toString(),
                displayName: member.displayName,
                email: member.email
            })),
            totalExpenses: 0, // TODO: Replace with real expense sum when expense model exists
            yourBalance: (group.memberBalances || []).find(b => b?.id?.toString() === userId)?.balance || 0,
            lastActivity: (group.updatedAt || group.createdAt)?.toISOString()
        }));

        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error("Get user groups error:", error);
        return res.status(500).json({
            success: false,
            error: "server_error"
        });
    }
}

async function getGroupDetails(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        const group = await Group.findById(groupId)
            .populate("members", "displayName email")
            .populate("owner", "_id")
            .lean();

        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const isMember = Array.isArray(group.members)
            ? group.members.some(m => m?._id?.toString() === requesterId)
            : false;
        const isOwner = group.owner?._id?.toString() === requesterId;

        if (!isMember && !isOwner) {
            return res.status(403).json({ success: false, error: "You are not authorized to view this group" });
        }

        const responseMembers = (group.members || []).map(member => ({
            userId: member._id.toString(),
            displayName: member.displayName,
            email: member.email
        }));
        const responseMemberBalances = (group.memberBalances || []).map(mb => ({
            id: mb.id?.toString(),
            balance: mb.balance
        }));

        return res.status(200).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                name: group.name,
                description: group.description,
                createdBy: group.owner?._id?.toString(),
                members: responseMembers,
                memberBalances: responseMemberBalances,
                createdAt: group.createdAt?.toISOString()
            }
        });
    } catch (error) {
        console.error("Get group details error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function getGroupBalances(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        const group = await Group.findById(groupId).select("members memberBalances").lean();
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const memberIds = Array.isArray(group.members) ? group.members.map(id => id.toString()) : [];
        if (!memberIds.includes(requesterId)) {
            return res.status(403).json({ success: false, error: "You are not authorized to view this group's balances" });
        }

        const balancesMap = new Map();
        (group.memberBalances || []).forEach(entry => {
            if (!entry?.id) return;
            balancesMap.set(entry.id.toString(), Number(entry.balance) || 0);
        });

        memberIds.forEach(id => {
            if (!balancesMap.has(id)) balancesMap.set(id, 0);
        });

        const creditors = [];
        const debtors = [];

        Array.from(balancesMap.entries()).forEach(([userId, balance]) => {
            const amount = Math.round(Number(balance) * 100) / 100;
            if (amount > 0.009) creditors.push({ userId, amount });
            else if (amount < -0.009) debtors.push({ userId, amount });
        });

        const sortDesc = (a, b) => {
            if (b.amount !== a.amount) return b.amount - a.amount;
            return a.userId.localeCompare(b.userId);
        };
        const sortAsc = (a, b) => {
            if (a.amount !== b.amount) return a.amount - b.amount;
            return a.userId.localeCompare(b.userId);
        };

        creditors.sort(sortDesc);
        debtors.sort(sortAsc);

        const simplifiedDebts = [];
        let i = 0;
        let j = 0;

        while (i < creditors.length && j < debtors.length) {
            const creditor = creditors[i];
            const debtor = debtors[j];
            const payAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
            simplifiedDebts.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: Math.round(payAmount * 100) / 100
            });

            creditor.amount -= payAmount;
            debtor.amount += payAmount; // debtor.amount is negative

            if (creditor.amount <= 0.009) i++;
            if (debtor.amount >= -0.009) j++;
        }

        const userDocs = await User.find({ _id: { $in: memberIds } }).select("displayName email").lean();
        const getName = (userId) => {
            const user = userDocs.find(u => u._id.toString() === userId);
            return user?.displayName || user?.email || "Unknown";
        };

        const responseSimplified = simplifiedDebts.map(item => ({
            from: { userId: item.from, displayName: getName(item.from) },
            to: { userId: item.to, displayName: getName(item.to) },
            amount: item.amount
        }));

        const responseMemberBalances = Array.from(balancesMap.entries())
            .sort(([idA, balA], [idB, balB]) => {
                if (balB !== balA) return balB - balA;
                return idA.localeCompare(idB);
            })
            .map(([userId, balance]) => ({
                userId,
                displayName: getName(userId),
                balance: Math.round(balance * 100) / 100
            }));

        return res.status(200).json({
            success: true,
            data: {
                groupId: groupId,
                simplifiedDebts: responseSimplified,
                memberBalances: responseMemberBalances
            }
        });
    } catch (error) {
        console.error("Get group balances error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function updateGroup(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;
        const { name, description } = req.body || {};

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const ownerId = group.owner?.toString?.() || group.ownerId?.toString?.();
        if (ownerId !== requesterId) {
            return res.status(403).json({ success: false, error: "You are not authorized to update this group" });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim() === "") {
                return res.status(400).json({ success: false, error: "invalid_name" });
            }
            group.name = name.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({ success: false, error: "invalid_description" });
            }
            group.description = description.trim();
        }

        await group.save();

        return res.status(200).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                name: group.name,
                description: group.description,
                updatedAt: group.updatedAt?.toISOString?.() || new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Update group error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function deleteGroup(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "You are not authorized to delete this group" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "Invalid group ID" });
        }

        const group = await Group.findById(groupId).select("owner");
        if (!group) {
            return res.status(404).json({ success: false, error: "Group not found" });
        }

        const ownerId = group.owner?.toString?.();
        if (ownerId !== requesterId) {
            return res.status(403).json({ success: false, error: "You are not authorized to delete this group" });
        }

        await Group.deleteOne({ _id: groupId });
        
        const expenses = await Expense.find({ group: groupId }).select("_id").lean();
        const expenseIds = expenses.map(e => e._id);
        await Expense.deleteMany({ _id: { $in: expenseIds } });

        const settlements = await Settlement.find({ group: groupId }).select("_id").lean();
        const settlementIds = settlements.map(s => s._id);
        await Settlement.deleteMany({ _id: { $in: settlementIds } });

        return res.status(200).json({
            success: true,
            data: {
                groupId,
                deleted: true
            }
        });
    } catch (error) {
        console.error("Delete group error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function joinGroup(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        const group = await Group.findById(groupId).populate("members", "displayName email");
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const isMember = Array.isArray(group.members)
            ? group.members.some(m => (m?._id || m)?.toString() === requesterId)
            : false;

        if (!isMember) {
            group.members.push(requesterId);
            const hasBalance = (group.memberBalances || []).some(b => b?.id?.toString() === requesterId);
            if (!hasBalance) {
                group.memberBalances.push({ id: requesterId, balance: 0 });
            }
            await group.save();
        }

        const isMemberInGroup = Array.isArray(group.members)
            ? group.members.some(m => (m?._id || m)?.toString() === requesterId)
            : false;
        if (!isMemberInGroup) {
            return res.status(500).json({ success: false, error: "failed_to_add_member" });
        }

        const responseMembers = (group.members || []).map(member => ({
            userId: (member?._id || member)?.toString(),
            displayName: member.displayName || member.email,
            email: member.email
        }));

        return res.status(200).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                name: group.name,
                description: group.description,
                members: responseMembers,
                memberCount: responseMembers.length
            }
        });
    } catch (error) {
        console.error("Join group error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

async function removeMember(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId, userId } = req.params;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: "invalid_id" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const ownerId = group.owner?.toString?.();
        if (ownerId !== requesterId) {
            return res.status(403).json({ success: false, error: "forbidden" });
        }

        // Owners cannot remove themselves
        if (userId === ownerId) {
            return res.status(400).json({ success: false, error: "cannot_remove_owner" });
        }

        const beforeCount = group.members.length;
        group.members = group.members.filter(m => m.toString() !== userId);
        // group.memberBalances = (group.memberBalances || []).filter(b => b.id?.toString() !== userId);

        if (group.members.length === beforeCount) {
            return res.status(404).json({ success: false, error: "member_not_found" });
        }

        await group.save();

        return res.status(200).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                removedUserId: userId,
                memberCount: group.members.length
            }
        });
    } catch (error) {
        console.error("Remove member error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

module.exports = { createGroup, getUserGroups, getGroupDetails, getGroupBalances, updateGroup, deleteGroup, joinGroup, removeMember };