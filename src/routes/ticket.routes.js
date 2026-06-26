const express = require("express");

const router = express.Router();

const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// POST /api/tickets - Tạo ticket (housekeeping, service_staff)
router.post("/", authMiddleware, ticketController.createTicket);

// GET /api/tickets - Danh sách ticket
router.get("/", authMiddleware, ticketController.getTickets);

// GET /api/tickets/:id - Chi tiết ticket
router.get("/:id", authMiddleware, ticketController.getTicketById);

// PATCH /api/tickets/:id - Cập nhật ticket (role-based trong service)
router.patch("/:id", authMiddleware, ticketController.updateTicket);

module.exports = router;
