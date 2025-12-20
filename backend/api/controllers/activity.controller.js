const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const Settlement = require("../models/settlement.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");

async function getRecentActivities(req, res) {
    try {
        const requesterId = req.user?.userId;
        const { page = 1, limit = 20, filter } = req.query;

        if (!requesterId) {
            return res.status(401).json({ success: false, error: "unauthorized" });
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

        // Get all groups where user is a member
        const userGroups = await Group.find({ "members.user": requesterId })
            .select("_id name owner members createdAt")
            .lean();

        if (userGroups.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    activities: [],
                    pagination: { page: pageNum, limit: limitNum, hasMore: false }
                }
            });
        }

        const groupIds = userGroups.map(g => g._id);
        const groupMap = new Map(userGroups.map(g => [g._id.toString(), g]));

        const activities = [];

        // 1. Fetch expenses (type: expense)
        if (!filter || filter === "all" || filter === "expense") {
            const expenses = await Expense.find({ group: { $in: groupIds } })
                .populate("paid_by", "username email")
                .populate("group", "name")
                .sort({ createdAt: -1 })
                .lean();

            for (const expense of expenses) {
                const userName = expense.paid_by?.username || expense.paid_by?.email || "Unknown";
                activities.push({
                    id: expense._id.toString(),
                    type: "expense",
                    description: `added an expense "${expense.description}"`,
                    amount: expense.amount,
                    groupId: expense.group?._id?.toString() || "",
                    groupName: expense.group?.name || "Unknown Group",
                    userId: expense.paid_by?._id?.toString() || "",
                    userName,
                    userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
                    timestamp: expense.createdAt?.toISOString() || new Date().toISOString()
                });
            }
        }

        // 2. Fetch settlements (type: payment)
        if (!filter || filter === "all" || filter === "payment") {
            const settlements = await Settlement.find({ group: { $in: groupIds } })
                .populate("from_user", "username email")
                .populate("to_user", "username email")
                .populate("group", "name")
                .sort({ createdAt: -1 })
                .lean();

            for (const settlement of settlements) {
                const fromUserName = settlement.from_user?.username || settlement.from_user?.email || "Unknown";
                activities.push({
                    id: settlement._id.toString(),
                    type: "payment",
                    description: "settled up",
                    amount: settlement.amount,
                    groupId: settlement.group?._id?.toString() || "",
                    groupName: settlement.group?.name || "Unknown Group",
                    userId: settlement.from_user?._id?.toString() || "",
                    userName: fromUserName,
                    userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fromUserName)}`,
                    timestamp: settlement.createdAt?.toISOString() || new Date().toISOString()
                });
            }
        }

        // 3. Fetch group creations (type: group_created)
        if (!filter || filter === "all" || filter === "group") {
            for (const group of userGroups) {
                // Get owner info
                const owner = await User.findById(group.owner).select("username email").lean();
                const ownerName = owner?.username || owner?.email || "Unknown";

                activities.push({
                    id: `group_created_${group._id.toString()}`,
                    type: "group_created",
                    description: "created the group",
                    groupId: group._id.toString(),
                    groupName: group.name,
                    userId: group.owner?.toString() || "",
                    userName: ownerName,
                    userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ownerName)}`,
                    timestamp: group.createdAt?.toISOString() || new Date().toISOString()
                });

                // 4. Add member_added activities for each member (except owner)
                // Using group.createdAt as approximation for first members, 
                // and current time spread for subsequent members
                const memberCount = group.members?.length || 0;
                if (memberCount > 1) {
                    for (let i = 1; i < group.members.length; i++) {
                        const member = group.members[i];
                        const memberUser = await User.findById(member.user).select("username email").lean();
                        const memberName = member.displayName || memberUser?.username || memberUser?.email || "Unknown";

                        // Approximate join time: spread between group creation and now
                        const groupCreatedTime = new Date(group.createdAt).getTime();
                        const now = Date.now();
                        const fraction = i / memberCount;
                        const approximateJoinTime = new Date(groupCreatedTime + (now - groupCreatedTime) * fraction * 0.5);

                        activities.push({
                            id: `member_added_${group._id.toString()}_${member.user?.toString()}`,
                            type: "member_added",
                            description: "joined the group",
                            groupId: group._id.toString(),
                            groupName: group.name,
                            userId: member.user?.toString() || "",
                            userName: memberName,
                            userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberName)}`,
                            timestamp: approximateJoinTime.toISOString()
                        });
                    }
                }
            }
        }

        // Sort all activities by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Pagination
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedActivities = activities.slice(startIndex, startIndex + limitNum);
        const hasMore = startIndex + limitNum < activities.length;

        return res.status(200).json({
            success: true,
            data: {
                activities: paginatedActivities,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    hasMore,
                    total: activities.length
                }
            }
        });
    } catch (error) {
        console.error("Get recent activities error:", error);
        return res.status(500).json({ success: false, error: "server_error" });
    }
}

module.exports = { getRecentActivities };
