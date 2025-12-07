const express = require("express");
const router = express.Router();

const { createSettlement, getSettlements, deleteSettlement } = require("../controllers/settlement.controller");
const authMiddleware = require("../middleware/auth");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/settlements", authMiddleware, createSettlement);
router.get("/settlements/:groupId", authMiddleware, getSettlements);
router.delete("/settlement/:settlementId", authMiddleware, deleteSettlement);

module.exports = router;
