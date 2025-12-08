const express = require("express");
const router = express.Router();

const { createGroup, getUserGroups, getGroupDetails, getGroupBalances, updateGroup, deleteGroup } = require("../controllers/group.controller");
const authMiddleware = require("../middleware/auth");

// Ensure JSON body parsing at router level (defensive)
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, getUserGroups);
router.get("/:groupId", authMiddleware, getGroupDetails);
router.get("/:groupId/balances", authMiddleware, getGroupBalances);
router.put("/:groupId", authMiddleware, updateGroup);
router.delete("/:groupId", authMiddleware, deleteGroup);

module.exports = router;
