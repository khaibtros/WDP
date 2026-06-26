const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/me", authMiddleware, userController.getCurrentUser);

router.get("/:id", authMiddleware, userController.getUserById);

router.put("/:id", authMiddleware, userController.updateProfile);

router.put(
  "/:id/change-password",
  authMiddleware,
  userController.changePassword,
);

module.exports = router;
