const express = require("express");

const router = express.Router();

const checkoutController = require("../controllers/checkout.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

// POST /api/check-outs - Checkout & tạo invoice (Receptionist)
router.post(
  "/",
  authMiddleware,
  requireRole("receptionist", "admin"),
  checkoutController.checkout
);

// GET /api/check-outs - Danh sách hóa đơn (Receptionist, Admin)
router.get(
  "/",
  authMiddleware,
  requireRole("receptionist", "admin"),
  checkoutController.getInvoiceList
);

module.exports = router;
