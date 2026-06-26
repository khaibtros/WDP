const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    roomCharge: {
      type: Number,
      required: true,
      min: 0,
    },

    serviceCharge: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
