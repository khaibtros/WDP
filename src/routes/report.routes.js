const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

router.use(authMiddleware);
router.use(requireRole("manager"));

router.get("/invoices", reportController.getInvoiceReport);
router.get("/payments", reportController.getPaymentReport);

module.exports = router;
