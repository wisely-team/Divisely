const mongoose = require("mongoose");
const Group = require("../models/group.model");
const User = require("../models/user.model");

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

        const group = await Group.create({
            name,
            description,
            owner: owner._id,
            members: memberUsers.map(u => u._id)
        });

        const responseMembers = memberUsers.map(u => ({
            userId: u._id.toString(),
            displayName: u.displayName,
            email: u.email
        }));

        return res.status(201).json({
            success: true,
            data: {
                groupId: group._id.toString(),
                name: group.name,
                description: group.description,
                createdBy: owner._id.toString(),
                members: responseMembers,
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

module.exports = { createGroup };
