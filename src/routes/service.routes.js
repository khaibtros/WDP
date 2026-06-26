const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/service.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

// Tất cả route đều yêu cầu JWT + role Manager
router.get("/", authMiddleware, requireRole("Manager"), serviceController.getAllServices);
router.get("/:id", authMiddleware, requireRole("Manager"), serviceController.getServiceById);
router.post("/", authMiddleware, requireRole("Manager"), serviceController.createService);
router.put("/:id", authMiddleware, requireRole("Manager"), serviceController.updateService);
router.put("/:id/status", authMiddleware, requireRole("Manager"), serviceController.toggleServiceStatus);

module.exports = router;
