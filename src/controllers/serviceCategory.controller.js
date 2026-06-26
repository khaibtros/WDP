const serviceCategoryService = require("../services/serviceCategory.service");

const getAllCategories = async (req, res) => {
  try {
    const { keyword } = req.query;
    const categories = await serviceCategoryService.getAllCategories(keyword);

    return res.status(200).json(categories);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await serviceCategoryService.getCategoryById(req.params.id);

    return res.status(200).json(category);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    await serviceCategoryService.createCategory(name, description);

    return res.status(201).json({ message: "Category created successfully" });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    await serviceCategoryService.updateCategory(req.params.id, name, description);

    return res.status(200).json({ message: "Category updated successfully" });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
};
