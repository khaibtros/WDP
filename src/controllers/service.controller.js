const serviceService = require("../services/service.service");

const getAllServices = async (req, res) => {
  try {
    const { page, pageSize, keyword, categoryId, isActive } = req.query;
    const result = await serviceService.getAllServices({ page, pageSize, keyword, categoryId, isActive });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);

    return res.status(200).json(service);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const createService = async (req, res) => {
  try {
    await serviceService.createService(req.body);

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateService = async (req, res) => {
  try {
    await serviceService.updateService(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const toggleServiceStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    await serviceService.toggleServiceStatus(req.params.id, isActive);

    return res.status(200).json({
      success: true,
      message: "Service status updated successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
};
