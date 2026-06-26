const express = require("express");

const router = express.Router();

const roomController = require("../controllers/room.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, roomController.getAllRooms);

router.get("/available", authMiddleware, roomController.getAvailableRooms);
router.get("/:id", authMiddleware, roomController.getRoomById);

router.post("/", authMiddleware, roomController.createRoom);

router.put("/:id", authMiddleware, roomController.updateRoom);

module.exports = router;
