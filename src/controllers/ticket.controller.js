const ticketService = require("../services/ticket.service");

/**
 * POST /api/tickets
 */
const createTicket = async (req, res) => {
  try {
    const result = await ticketService.createTicket(req.body, req.user.userId);
    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: result,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /api/tickets
 */
const getTickets = async (req, res) => {
  try {
    const result = await ticketService.getTickets(req.query);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /api/tickets/:id
 */
const getTicketById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    return res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * PATCH /api/tickets/:id
 */
const updateTicket = async (req, res) => {
  try {
    await ticketService.updateTicket(req.params.id, req.body, req.user.role);
    return res.json({
      success: true,
      message: "Ticket updated successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
};
