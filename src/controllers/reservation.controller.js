const reservationService = require("../services/reservation.service");

const getAllReservations = async (req, res) => {
  try {
    const result = await reservationService.getAllReservations(req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message,
      });
  }
};

const getReservationById = async (req, res) => {
  try {
    const reservation = await reservationService.getReservationById(
      req.params.id,
    );
    res.json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message,
      });
  }
};

const createReservation = async (req, res) => {
  try {
    const reservation = await reservationService.createReservation(
      req.body,
      req.user.userId,
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Reservation created successfully",
        data: reservation,
      });
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message,
      });
  }
};

const updateReservation = async (req, res) => {
  try {
    const reservation = await reservationService.updateReservation(
      req.params.id,
      req.body,
    );
    res.json({
      success: true,
      message: "Reservation updated successfully",
      data: reservation,
    });
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message,
      });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const reservation = await reservationService.cancelReservation(
      req.params.id,
    );
    res.json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (err) {
    res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message,
      });
  }
};

module.exports = {
  getAllReservations,

  getReservationById,

  createReservation,

  updateReservation,

  cancelReservation
};
