const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Reservation = require("../models/Reservation");
const Customer = require("../models/Customer");

const getInvoiceReport = async (query) => {
  const { invoiceNumber, customerName, dateFrom, dateTo } = query;
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  const matchStage = {};

  if (invoiceNumber) {
    matchStage.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
  }

  if (dateFrom || dateTo) {
    matchStage.issuedAt = {};
    if (dateFrom) matchStage.issuedAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.issuedAt.$lte = new Date(dateTo);
  }

  if (customerName) {
    const customers = await Customer.find({
      $or: [
        { firstName: { $regex: customerName, $options: "i" } },
        { lastName: { $regex: customerName, $options: "i" } },
      ],
    });
    const customerIds = customers.map((c) => c._id);
    const reservations = await Reservation.find({ customerId: { $in: customerIds } });
    const reservationIds = reservations.map((r) => r._id);
    matchStage.reservationId = { $in: reservationIds };
  }

  const skip = (page - 1) * pageSize;

  const invoices = await Invoice.find(matchStage)
    .populate({
      path: "reservationId",
      populate: { path: "customerId", select: "firstName lastName" },
    })
    .sort({ issuedAt: -1 })
    .skip(skip)
    .limit(pageSize);

  const totalItems = await Invoice.countDocuments(matchStage);

  const items = invoices.map((inv) => {
    const customer = inv.reservationId?.customerId;
    const name = customer ? `${customer.firstName} ${customer.lastName}` : "N/A";

    return {
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName: name,
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
  };
};

const getPaymentReport = async (query) => {
  const { paymentMethod, status, dateFrom, dateTo } = query;
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  const matchStage = {};

  if (paymentMethod) {
    matchStage.paymentMethod = paymentMethod;
  }
  if (status) {
    matchStage.status = status;
  }
  if (dateFrom || dateTo) {
    matchStage.paidAt = {};
    if (dateFrom) matchStage.paidAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.paidAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * pageSize;

  const payments = await Payment.find(matchStage)
    .populate("customerId", "firstName lastName")
    .sort({ paidAt: -1 })
    .skip(skip)
    .limit(pageSize);

  const totalItems = await Payment.countDocuments(matchStage);

  const items = payments.map((pmt) => {
    const customer = pmt.customerId;
    const name = customer ? `${customer.firstName} ${customer.lastName}` : "N/A";

    return {
      _id: pmt._id,
      reservationId: pmt.reservationId,
      customerName: name,
      amount: pmt.amount,
      paymentMethod: pmt.paymentMethod,
      status: pmt.status,
      paidAt: pmt.paidAt,
    };
  });

  return {
    items,
    page,
    pageSize,
    totalItems,
  };
};

module.exports = {
  getInvoiceReport,
  getPaymentReport,
};
