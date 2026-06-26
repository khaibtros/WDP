const Reservation = require("../models/Reservation");
const Customer = require("../models/Customer");
const Room = require("../models/Room");

const { createError } = require("../utils/error.util");

const getAllReservations = async (query) => {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  const reservations = await Reservation.find(filter)
    .populate("customerId")
    .populate("roomId")
    .populate("createdBy")
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const totalItems = await Reservation.countDocuments(filter);

  return {
    items: reservations,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
};

const getReservationById = async (id) => {
  const reservation = await Reservation.findById(id)

    .populate("customerId")

    .populate("roomId")

    .populate("createdBy");

  if (!reservation) {
    throw createError("Reservation not found", 404);
  }
  return reservation;
};

const createReservation = async (body, userId) => {
  const roomId = body.roomId;
  const checkInDate = body.checkInDate;
  const checkOutDate = body.checkOutDate;
  const adults = body.adults;
  const children = body.children;
  const customer = body.customer;

  const room = await Room.findById(roomId);

  if (!room) {
    throw createError("Room not found", 404);
  }

  if (!customer) {
    throw createError("Customer information is required", 400);
  }

  if (!customer.firstName) {
    throw createError("First name is required", 400);
  }

  if (!customer.lastName) {
    throw createError("Last name is required", 400);
  }

  if (!customer.identityNumber) {
    throw createError("Identity number is required", 400);
  }

  if (new Date(checkOutDate) <= new Date(checkInDate)) {
    throw createError("Invalid date range", 400);
  }

  const overlap = await Reservation.findOne({
    roomId,

    status: {
      $nin: ["cancelled", "completed"],
    },

    checkInDate: {
      $lt: checkOutDate,
    },

    checkOutDate: {
      $gt: checkInDate,
    },
  });

  if (overlap) {
    throw createError("Room already reserved", 409);
  }

  let customerDb = await Customer.findOne({
    identityNumber: customer.identityNumber,
  });

  if (!customerDb) {
    customerDb = await Customer.create({
      firstName: customer.firstName,

      lastName: customer.lastName,

      email: customer.email,

      phoneNumber: customer.phoneNumber,

      nationality: customer.nationality,

      identityType: customer.identityType,

      identityNumber: customer.identityNumber,

      address: customer.address,
    });
  } else {
    customerDb.firstName = customer.firstName;

    customerDb.lastName = customer.lastName;

    customerDb.email = customer.email;

    customerDb.phoneNumber = customer.phoneNumber;

    customerDb.nationality = customer.nationality;

    customerDb.identityType = customer.identityType;

    customerDb.address = customer.address;

    await customerDb.save();
  }

  const reservation = await Reservation.create({
    customerId: customerDb._id,

    roomId,

    checkInDate,

    checkOutDate,

    adults,

    children,

    createdBy: userId,
  });

  return reservation;
};

const updateReservation = async (id, body) => {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw createError("Reservation not found", 404);
  }

  if (reservation.status === "checked_in") {
    throw createError("Cannot update checked in reservation", 400);
  }

  if (body.checkInDate) {
    reservation.checkInDate = body.checkInDate;
  }

  if (body.checkOutDate) {
    reservation.checkOutDate = body.checkOutDate;
  }

  if (body.adults) {
    reservation.adults = body.adults;
  }

  if (body.children != null) {
    reservation.children = body.children;
  }

  await reservation.save();

  return reservation;
};

const cancelReservation = async (id) => {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw createError("Reservation not found", 404);
  }

  if (reservation.status === "checked_in") {
    throw createError("Cannot cancel checked-in reservation", 400);
  }

  reservation.status = "cancelled";

  await reservation.save();

  return reservation;
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
};
