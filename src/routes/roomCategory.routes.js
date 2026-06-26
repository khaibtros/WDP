const express = require("express");
const router = express.Router();

const roomCategoryController = require("../controllers/roomCategory.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

router.get("/", authMiddleware, requireRole("Manager"), roomCategoryController.getAllRoomCategories);
router.get("/:id", authMiddleware, requireRole("Manager"), roomCategoryController.getRoomCategoryById);
router.post("/", authMiddleware, requireRole("Manager"), roomCategoryController.createRoomCategory);
router.put("/:id", authMiddleware, requireRole("Manager"), roomCategoryController.updateRoomCategory);

module.exports = router;
