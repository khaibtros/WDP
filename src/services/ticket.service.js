const Ticket = require("../models/Ticket");
const Task = require("../models/Task");
const Room = require("../models/Room");
const Reservation = require("../models/Reservation");

const { createError } = require("../utils/error.util");

/**
 * POST /api/tickets
 * Tạo maintenance ticket từ housekeeping task không hoàn thành
 */
const createTicket = async (body, userId) => {
  const { ticketType, content, taskId, recipientId } = body;

  // 1. Validate required fields
  if (!ticketType || !content) {
    throw createError("ticketType and content are required", 400);
  }

  // 2. Nếu có taskId, tìm và validate task
  let task = null;
  if (taskId) {
    task = await Task.findById(taskId).populate({
      path: "reservationId",
      populate: { path: "roomId" },
    });

    if (!task) {
      throw createError("Task not found", 404);
    }

    // 3. Kiểm tra ticket đã tồn tại cho task này chưa
    const existingTicket = await Ticket.findOne({ taskId });
    if (existingTicket) {
      throw createError("Ticket already exists", 400);
    }

    // 4. Cập nhật Task.status → cannot_complete
    task.status = "cannot_complete";
    await task.save();

    // 5. Nếu là maintenance ticket, cập nhật Room.status → maintenance
    if (ticketType === "maintenance") {
      const reservation = task.reservationId;
      if (reservation && reservation.roomId) {
        const room = await Room.findById(reservation.roomId._id || reservation.roomId);
        if (room) {
          room.status = "maintenance";
          await room.save();
        }
      }
    }
  }

  // 6. Tạo ticket
  const ticket = await Ticket.create({
    ticketType,
    content,
    taskId: taskId || null,
    senderId: userId,
    recipientId: recipientId || null,
    status: "open",
  });

  return {
    _id: ticket._id,
    status: ticket.status,
  };
};

/**
 * GET /api/tickets
 * Danh sách ticket, filter theo status, ticketType, recipientId
 */
const getTickets = async (query) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.ticketType) {
    filter.ticketType = query.ticketType;
  }

  if (query.recipientId) {
    filter.recipientId = query.recipientId;
  }

  const tickets = await Ticket.find(filter)
    .populate("senderId", "firstName lastName")
    .populate("recipientId", "firstName lastName")
    .populate("taskId", "description taskType status")
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const totalItems = await Ticket.countDocuments(filter);

  return {
    items: tickets.map((t) => ({
      _id: t._id,
      ticketType: t.ticketType,
      content: t.content,
      status: t.status,
      senderId: t.senderId,
      recipientId: t.recipientId,
      taskId: t.taskId,
      createdAt: t.createdAt,
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
};

/**
 * GET /api/tickets/:id
 * Chi tiết ticket
 */
const getTicketById = async (id) => {
  const ticket = await Ticket.findById(id)
    .populate("senderId", "firstName lastName")
    .populate("recipientId", "firstName lastName")
    .populate("taskId");

  if (!ticket) {
    throw createError("Ticket not found", 404);
  }

  return ticket;
};

/**
 * PATCH /api/tickets/:id
 * Cập nhật ticket theo role:
 *   - service_staff / housekeeping: chỉ được cập nhật content
 *   - manager / admin: chỉ được cập nhật status
 * Status transition: open → in_progress → resolved → (không update nữa)
 */
const updateTicket = async (id, body, userRole) => {
  const ticket = await Ticket.findById(id).populate({
    path: "taskId",
    populate: {
      path: "reservationId",
      populate: { path: "roomId" },
    },
  });

  if (!ticket) {
    throw createError("Ticket not found", 404);
  }

  // Không cho cập nhật ticket đã resolved
  if (ticket.status === "resolved") {
    throw createError("Resolved tickets cannot be updated", 400);
  }

  // Xác định các field được phép theo role
  const staffRoles = ["service_staff", "housekeeping"];
  const managerRoles = ["manager", "admin"];

  const requestedFields = Object.keys(body);

  if (staffRoles.includes(userRole)) {
    // Staff chỉ được update content
    const forbiddenFields = requestedFields.filter((f) => f !== "content");
    if (forbiddenFields.length > 0) {
      throw createError("You are not allowed to update these fields", 403);
    }
    if (body.content !== undefined) {
      ticket.content = body.content;
    }
  } else if (managerRoles.includes(userRole)) {
    // Manager chỉ được update status
    const forbiddenFields = requestedFields.filter((f) => f !== "status");
    if (forbiddenFields.length > 0) {
      throw createError("You are not allowed to update these fields", 403);
    }

    if (body.status !== undefined) {
      // Kiểm tra status transition
      const validTransitions = {
        open: "in_progress",
        in_progress: "resolved",
      };

      const allowed = validTransitions[ticket.status];
      if (!allowed || allowed !== body.status) {
        throw createError("Invalid status transition", 400);
      }

      ticket.status = body.status;

      // Nếu resolved và có task liên quan → Room.status = available
      if (body.status === "resolved" && ticket.taskId) {
        const task = ticket.taskId;
        const reservation = task.reservationId;
        if (reservation && reservation.roomId) {
          const room = await Room.findById(
            reservation.roomId._id || reservation.roomId
          );
          if (room && room.status === "maintenance") {
            room.status = "available";
            await room.save();
          }
        }
      }
    }
  } else {
    throw createError("You are not allowed to update these fields", 403);
  }

  await ticket.save();

  return ticket;
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
};
