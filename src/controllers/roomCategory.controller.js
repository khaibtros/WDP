const roomCategoryService = require("../services/roomCategory.service");

const getAllRoomCategories = async (req, res) => {
  try {
    const { keyword } = req.query;
    const categories = await roomCategoryService.getAllRoomCategories(keyword);

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const getRoomCategoryById = async (req, res) => {
  try {
    const category = await roomCategoryService.getRoomCategoryById(req.params.id);

    return res.status(200).json(category);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const createRoomCategory = async (req, res) => {
  try {
    await roomCategoryService.createRoomCategory(req.body);

    return res.status(201).json({
      success: true,
      message: "Room category created successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateRoomCategory = async (req, res) => {
  try {
    await roomCategoryService.updateRoomCategory(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Room category updated successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllRoomCategories,
  getRoomCategoryById,
  createRoomCategory,
  updateRoomCategory,
};
