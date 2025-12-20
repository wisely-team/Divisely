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

        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
        const ownerDisplayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                error: "unauthorized"
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                error: "missing_fields",
                message: "Group name is required"
            });
        }

        const owner = await User.findById(ownerId).select("username email");
        if (!owner) {
            return res.status(401).json({
                success: false,
                error: "user_not_found"
            });
        }

        // Use provided displayName or fallback to username
        const finalDisplayName = ownerDisplayName || owner.username;

        // Create members array with embedded structure
        const members = [{
            user: owner._id,
            displayName: finalDisplayName
        }];

        const memberBalances = [{ userId: owner._id, balance: 0 }];

        const group = await Group.create({
            name,
            description,
            owner: owner._id,
            members,
            memberBalances
        });

        const responseMembers = members.map(m => ({
            userId: m.user.toString(),
            username: owner.username,
            displayName: m.displayName,
            email: owner.email
        }));
        const responseMemberBalances = memberBalances.map(mb => ({
            userId: mb.userId.toString(),
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

        // Query groups where any member.user matches the userId
        const groups = await Group.find({ "members.user": userId })
            .populate("members.user", "username email")
            .sort({ updatedAt: -1 })
            .lean();

        const response = groups.map(group => ({
            groupId: group._id.toString(),
            name: group.name,
            description: group.description,
            memberCount: Array.isArray(group.members) ? group.members.length : 0,
            members: (group.members || []).map(member => ({
                userId: member.user?._id?.toString() || member.user?.toString(),
                username: member.user?.username,
                displayName: member.displayName,
                email: member.user?.email
            })),
            totalExpenses: 0,
            yourBalance: (group.memberBalances || []).find(b => b?.userId?.toString() === userId)?.balance || 0,
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
            .populate("members.user", "username email")
            .populate("owner", "_id")
            .lean();

        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        const isMember = Array.isArray(group.members)
            ? group.members.some(m => (m?.user?._id || m?.user)?.toString() === requesterId)
            : false;
        const isOwner = group.owner?._id?.toString() === requesterId;

        if (!isMember && !isOwner) {
            return res.status(403).json({ success: false, error: "You are not authorized to view this group" });
        }

        const responseMembers = (group.members || []).map(member => ({
            userId: (member.user?._id || member.user)?.toString(),
            username: member.user?.username,
            displayName: member.displayName,
            email: member.user?.email
        }));
        const responseMemberBalances = (group.memberBalances || []).map(mb => ({
            userId: mb.userId?.toString(),
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

        const group = await Group.findById(groupId)
            .populate("members.user", "username email")
            .select("members memberBalances")
            .lean();
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        // Extract member user IDs from embedded structure
        const memberIds = Array.isArray(group.members)
            ? group.members.map(m => (m.user?._id || m.user)?.toString())
            : [];
        if (!memberIds.includes(requesterId)) {
            return res.status(403).json({ success: false, error: "You are not authorized to view this group's balances" });
        }

        // Build a map of userId -> { username, displayName }
        const memberInfoMap = new Map();
        (group.members || []).forEach(m => {
            const uid = (m.user?._id || m.user)?.toString();
            memberInfoMap.set(uid, {
                username: m.user?.username,
                displayName: m.displayName
            });
        });

        const balancesMap = new Map();
        (group.memberBalances || []).forEach(entry => {
            if (!entry?.userId) return;
            balancesMap.set(entry.userId.toString(), Number(entry.balance) || 0);
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
            debtor.amount += payAmount;

            if (creditor.amount <= 0.009) i++;
            if (debtor.amount >= -0.009) j++;
        }

        const getInfo = (userId) => memberInfoMap.get(userId) || { username: "Unknown", displayName: "Unknown" };

        const responseSimplified = simplifiedDebts.map(item => ({
            from: { userId: item.from, username: getInfo(item.from).username, displayName: getInfo(item.from).displayName },
            to: { userId: item.to, username: getInfo(item.to).username, displayName: getInfo(item.to).displayName },
            amount: item.amount
        }));

        const responseMemberBalances = Array.from(balancesMap.entries())
            .sort(([idA, balA], [idB, balB]) => {
                if (balB !== balA) return balB - balA;
                return idA.localeCompare(idB);
            })
            .map(([userId, balance]) => ({
                userId,
                username: getInfo(userId).username,
                displayName: getInfo(userId).displayName,
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
        const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        const group = await Group.findById(groupId).populate("members.user", "username email");
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        // Check if already a member
        const isMember = Array.isArray(group.members)
            ? group.members.some(m => (m?.user?._id || m?.user)?.toString() === requesterId)
            : false;

        if (isMember) {
            // User is already a member, return success with current group data
            const responseMembers = (group.members || []).map(member => ({
                userId: (member.user?._id || member.user)?.toString(),
                username: member.user?.username,
                displayName: member.displayName,
                email: member.user?.email
            }));

            return res.status(200).json({
                success: true,
                data: {
                    groupId: group._id.toString(),
                    name: group.name,
                    description: group.description,
                    members: responseMembers,
                    memberCount: responseMembers.length
                },
                message: "already_member"
            });
        }

        // Get user info for the joining user
        const joiningUser = await User.findById(requesterId).select("username email");
        if (!joiningUser) {
            return res.status(404).json({ success: false, error: "user_not_found" });
        }

        // Use provided displayName or fallback to username
        const finalDisplayName = displayName || joiningUser.username;

        // Add new member with embedded structure
        group.members.push({
            user: requesterId,
            displayName: finalDisplayName
        });

        const hasBalance = (group.memberBalances || []).some(b => b?.userId?.toString() === requesterId);
        if (!hasBalance) {
            group.memberBalances.push({ userId: requesterId, balance: 0 });
        }
        await group.save();

        // Re-populate to get full user info
        await group.populate("members.user", "username email");

        const responseMembers = (group.members || []).map(member => ({
            userId: (member.user?._id || member.user)?.toString(),
            username: member.user?.username,
            displayName: member.displayName,
            email: member.user?.email
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
        // Filter out the member with matching user ID from embedded structure
        group.members = group.members.filter(m => {
            const memberUserId = (m.user?._id || m.user)?.toString();
            return memberUserId !== userId;
        });

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

async function updateMyDisplayName(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { groupId } = req.params;
        const { displayName } = req.body;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, error: "invalid_group_id" });
        }

        if (!displayName || typeof displayName !== "string" || displayName.trim() === "") {
            return res.status(400).json({ success: false, error: "invalid_display_name" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, error: "group_not_found" });
        }

        // Find the member and update their displayName
        const memberIndex = group.members.findIndex(m => {
            const userId = (m.user?._id || m.user)?.toString();
            return userId === requesterId;
        });

        if (memberIndex === -1) {
            return res.status(403).json({ success: false, error: "not_a_member" });
        }

        group.members[memberIndex].displayName = displayName.trim();
        await group.save();

        return res.status(200).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                displayName: displayName.trim()
            }
        });
    } catch (error) {
        console.error("Update display name error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}


module.exports = { createGroup, getUserGroups, getGroupDetails, getGroupBalances, updateGroup, deleteGroup, joinGroup, removeMember, updateMyDisplayName };