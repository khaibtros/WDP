const express = require("express");
const router = express.Router();

const serviceCategoryController = require("../controllers/serviceCategory.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

// Tất cả route đều yêu cầu JWT + role Manager
router.get("/", authMiddleware, requireRole("Manager"), serviceCategoryController.getAllCategories);
router.get("/:id", authMiddleware, requireRole("Manager"), serviceCategoryController.getCategoryById);
router.post("/", authMiddleware, requireRole("Manager"), serviceCategoryController.createCategory);
router.put("/:id", authMiddleware, requireRole("Manager"), serviceCategoryController.updateCategory);

module.exports = router;
