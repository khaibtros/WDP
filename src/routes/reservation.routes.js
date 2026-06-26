const express = require("express");

const router = express.Router();

const reservationController = require("../controllers/reservation.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, reservationController.getAllReservations);

router.get("/:id", authMiddleware, reservationController.getReservationById);

router.post("/", authMiddleware, reservationController.createReservation);

router.put("/:id", authMiddleware, reservationController.updateReservation);

router.put(
  "/:id/cancel",
  authMiddleware,
  reservationController.cancelReservation,
);

module.exports = router;
