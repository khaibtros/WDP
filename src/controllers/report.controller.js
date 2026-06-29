const reportService = require("../services/report.service");

const getInvoiceReport = async (req, res) => {
  try {
    const result = await reportService.getInvoiceReport(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getInvoiceReport:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPaymentReport = async (req, res) => {
  try {
    const result = await reportService.getPaymentReport(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getPaymentReport:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getInvoiceReport,
  getPaymentReport,
};
