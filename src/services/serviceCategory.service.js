const ServiceCategory = require("../models/ServiceCategory");
const { createError } = require("../utils/error.util");

// GET /api/service-categories?keyword=...
const getAllCategories = async (keyword = "") => {
  const filter = keyword
    ? { name: { $regex: keyword, $options: "i" } }
    : {};

  const categories = await ServiceCategory.find(filter)
    .select("_id name description")
    .lean();

  return categories;
};

// GET /api/service-categories/:id
const getCategoryById = async (id) => {
  const category = await ServiceCategory.findById(id)
    .select("_id name description createdAt")
    .lean();

  if (!category) {
    throw createError("Category not found", 404);
  }

  return category;
};

// POST /api/service-categories
const createCategory = async (name, description) => {
  if (!name || !name.trim()) {
    throw createError("Name is required", 400);
  }

  const existing = await ServiceCategory.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  });

  if (existing) {
    throw createError("Category name already exists", 409);
  }

  await ServiceCategory.create({ name: name.trim(), description });
};

// PUT /api/service-categories/:id
const updateCategory = async (id, name, description) => {
  const category = await ServiceCategory.findById(id);

  if (!category) {
    throw createError("Category not found", 404);
  }

  // Kiểm tra tên trùng với category khác (không phải chính nó)
  if (name && name.trim() !== category.name) {
    const existing = await ServiceCategory.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      throw createError("Category name already exists", 409);
    }
  }

  if (name !== undefined) category.name = name.trim();
  if (description !== undefined) category.description = description;

  await category.save();
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
};
