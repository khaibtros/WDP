const Reservation = require("../models/Reservation");
const Room = require("../models/Room");
const RoomCategory = require("../models/RoomCategory");
const Task = require("../models/Task");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Role = require("../models/Role");

const { createError } = require("../utils/error.util");
const { calculateBilling } = require("./billing.service");

/**
 * Tạo invoice number theo format INV-YYYYMMDDXXX
 * Ví dụ: INV-20260621001
 */
const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const prefix = `INV-${dateStr}`;

  // Đếm số invoice đã tạo trong ngày hôm nay
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const count = await Invoice.countDocuments({
    issuedAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
};

/**
 * POST /api/check-outs
 * Checkout reservation, tạo invoice và housekeeping task
 */
const checkoutReservation = async (reservationId, userId) => {
  // 1. Tìm reservation
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw createError("Reservation not found", 404);
  }

  // 2. Kiểm tra trạng thái reservation phải là checked_in
  if (reservation.status !== "checked_in") {
    throw createError("Reservation is not checked in", 400);
  }

  // 3. Kiểm tra invoice chưa tồn tại
  const existingInvoice = await Invoice.findOne({
    reservationId: reservation._id,
  });
  if (existingInvoice) {
    throw createError("Invoice already generated", 400);
  }

  // 4. Lấy thông tin phòng và danh mục phòng
  const room = await Room.findById(reservation.roomId).populate("categoryId");
  if (!room) {
    throw createError("Room not found", 404);
  }

  const roomCategory = room.categoryId;
  if (!roomCategory) {
    throw createError("Room category not found", 404);
  }

  // 5. Lấy tất cả service_request tasks của reservation này
  const tasks = await Task.find({
    reservationId: reservation._id,
    taskType: "service_request",
    status: { $nin: ["cancelled"] },
  });

  // 6. Tính billing
  const billing = calculateBilling({
    basePrice: roomCategory.basePrice,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    tasks,
  });

  // 7. Tạo invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // 8. Tạo Invoice
  const invoice = await Invoice.create({
    reservationId: reservation._id,
    invoiceNumber,
    roomCharge: billing.roomCharge,
    serviceCharge: billing.serviceCharge,
    taxAmount: billing.taxAmount,
    totalAmount: billing.totalAmount,
    issuedAt: new Date(),
    generatedBy: userId,
  });

  // 9. Cập nhật trạng thái reservation → completed
  reservation.status = "completed";
  await reservation.save();

  // 10. Cập nhật trạng thái phòng → available
  room.status = "available";
  await room.save();

  // 11. Tạo housekeeping task tự động và assign cho nhân viên housekeeping
  let assignedTo = null;
  try {
    const housekeepingRole = await Role.findOne({ roleName: "housekeeping" });
    if (housekeepingRole) {
      const housekeepers = await User.find({ roleId: housekeepingRole._id, status: "active" });
      if (housekeepers.length > 0) {
        // Đếm số lượng task đang làm/chưa làm của từng housekeeper
        const taskCounts = await Promise.all(housekeepers.map(async (hk) => {
          const count = await Task.countDocuments({
            assignedTo: hk._id,
            status: { $in: ["pending", "in_progress"] }
          });
          return { hk, count };
        }));
        
        // Sắp xếp tăng dần theo số lượng task, chọn người có ít task nhất
        taskCounts.sort((a, b) => a.count - b.count);
        assignedTo = taskCounts[0].hk._id;
      }
    }
  } catch (error) {
    console.error("Lỗi khi tự động assign task cho housekeeping:", error);
  }

  await Task.create({
    taskType: "housekeeping",
    description: `Clean room ${room.roomNumber}`,
    reservationId: reservation._id,
    quantity: 1,
    unitPrice: 0,
    status: "pending",
    orderedBy: userId,
    assignedTo: assignedTo,
  });

  return {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
  };
};

/**
 * GET /api/check-outs
 * Trả về danh sách hóa đơn (invoice list)
 */
const getInvoiceList = async (query) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  const invoices = await Invoice.find()
    .populate({
      path: "reservationId",
      populate: [
        { path: "customerId", select: "firstName lastName" },
        { path: "roomId", select: "roomNumber" },
      ],
    })
    .populate("generatedBy", "firstName lastName")
    .sort({ issuedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const totalItems = await Invoice.countDocuments();

  const items = invoices.map((inv) => {
    const reservation = inv.reservationId;
    const customer = reservation?.customerId;
    const room = reservation?.roomId;

    return {
      invoiceId: inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "N/A",
      roomNumber: room?.roomNumber || "N/A",
      roomCharge: inv.roomCharge,
      serviceCharge: inv.serviceCharge,
      taxAmount: inv.taxAmount,
      totalAmount: inv.totalAmount,
      issuedAt: inv.issuedAt,
    };
  });

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
};

module.exports = {
  checkoutReservation,
  getInvoiceList,
};
