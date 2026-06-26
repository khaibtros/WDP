const roomService = require("../services/room.service");

const getAllRooms = async (req, res) => {
  try {
    const result = await roomService.getAllRooms(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const getRoomById = async (req, res) => {
  try {
    const room = await roomService.getRoomById(req.params.id);

    res.json({
      success: true,
      data: room,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const room = await roomService.createRoom(req.body);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);

    res.json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};
const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await roomService.getAvailableRooms(req.query);

    res.json({
      success: true,
      data: rooms,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  getAvailableRooms
};
