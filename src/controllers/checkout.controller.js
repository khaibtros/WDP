const checkoutService = require("../services/checkout.service");

/**
 * POST /api/check-outs
 * Body: { reservationId }
 */
const checkout = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "reservationId is required",
      });
    }

    const result = await checkoutService.checkoutReservation(
      reservationId,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Checkout successful",
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
 * GET /api/check-outs
 * Query: page, pageSize
 */
const getInvoiceList = async (req, res) => {
  try {
    const result = await checkoutService.getInvoiceList(req.query);

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

module.exports = {
  checkout,
  getInvoiceList,
};
