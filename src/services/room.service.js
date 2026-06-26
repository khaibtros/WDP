const Room = require("../models/Room");
const RoomCategory = require("../models/RoomCategory");
const Reservation = require("../models/Reservation");

const { createError } = require("../utils/error.util");

const VALID_STATUS = ["available", "occupied", "reserved", "maintenance"];

const getAllRooms = async (query) => {
  const { status, floor, categoryId } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (floor) {
    filter.floor = Number(floor);
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  const rooms = await Room.find(filter).populate("categoryId");

  return {
    items: rooms,
  };
};

const getRoomById = async (roomId) => {
  const room = await Room.findById(roomId).populate("categoryId");

  if (!room) {
    throw createError("Room not found", 404);
  }

  return room;
};

const createRoom = async (body) => {
  const { roomNumber, categoryId, floor, status } = body;

  if (!roomNumber) {
    throw createError("Room number is required", 400);
  }

  if (!categoryId) {
    throw createError("Category is required", 400);
  }

  if (!floor) {
    throw createError("Floor is required", 400);
  }

  const existedRoom = await Room.findOne({
    roomNumber,
  });

  if (existedRoom) {
    throw createError("Room number already exists", 409);
  }

  const category = await RoomCategory.findById(categoryId);

  if (!category) {
    throw createError("Room category not found", 404);
  }

  if (status && !VALID_STATUS.includes(status)) {
    throw createError("Invalid room status", 400);
  }

  const room = await Room.create({
    roomNumber,
    categoryId,
    floor,
    status,
  });

  return room;
};

const updateRoom = async (roomId, body) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw createError("Room not found", 404);
  }

  if (body.roomNumber) {
    const existedRoom = await Room.findOne({
      roomNumber: body.roomNumber,
      _id: { $ne: roomId },
    });

    if (existedRoom) {
      throw createError("Room number already exists", 409);
    }

    room.roomNumber = body.roomNumber;
  }

  if (body.categoryId) {
    const category = await RoomCategory.findById(body.categoryId);

    if (!category) {
      throw createError("Room category not found", 404);
    }

    room.categoryId = body.categoryId;
  }

  if (body.floor) {
    room.floor = body.floor;
  }

  if (body.status) {
    if (!VALID_STATUS.includes(body.status)) {
      throw createError("Invalid room status", 400);
    }

    room.status = body.status;
  }

  await room.save();

  return room;
};

const getAvailableRooms = async (query) => {
  const { checkInDate, checkOutDate } = query;

  if (!checkInDate || !checkOutDate) {
    throw createError("Check-in and check-out date are required", 400);
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkOut <= checkIn) {
    throw createError("Check-out date must be after check-in date", 400);
  }

  const reservedRooms = await Reservation.find({
    status: {
      $nin: ["cancelled", "completed"],
    },

    checkInDate: {
      $lt: checkOut,
    },

    checkOutDate: {
      $gt: checkIn,
    },
  }).select("roomId");

  const roomIds = reservedRooms.map((r) => r.roomId);

  const rooms = await Room.find({
    _id: {
      $nin: roomIds,
    },

    status: "available",
  }).populate("categoryId");

  return rooms;
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  getAvailableRooms,
};
