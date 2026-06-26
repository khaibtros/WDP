const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const { createError } = require("../utils/error.util");

// GET /api/services?page=1&pageSize=10&keyword=&categoryId=&isActive=
const getAllServices = async ({ page = 1, pageSize = 10, keyword, categoryId, isActive }) => {
  const filter = {};

  if (keyword) {
    filter.name = { $regex: keyword, $options: "i" };
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  // isActive có thể là string "true"/"false" từ query param
  if (isActive !== undefined && isActive !== "") {
    filter.isActive = isActive === "true" || isActive === true;
  }

  const pageNum = parseInt(page) || 1;
  const limit = parseInt(pageSize) || 10;
  const skip = (pageNum - 1) * limit;

  const [items, total] = await Promise.all([
    Service.find(filter)
      .select("_id categoryId name description price isActive")
      .populate("categoryId", "name")
      .skip(skip)
      .limit(limit)
      .lean(),
    Service.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: pageNum,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
};

// GET /api/services/:id
const getServiceById = async (id) => {
  const service = await Service.findById(id)
    .select("_id categoryId name description price isActive")
    .lean();

  if (!service) {
    throw createError("Service not found", 404);
  }

  return service;
};

// POST /api/services
const createService = async ({ categoryId, name, description, price, isActive }) => {
  if (!categoryId || !name || price === undefined) {
    throw createError("Required fields are missing", 400);
  }

  const category = await ServiceCategory.findById(categoryId).lean();
  if (!category) {
    throw createError("Category not found", 404);
  }

  const existing = await Service.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  });
  if (existing) {
    throw createError("Service name already exists", 409);
  }

  await Service.create({
    categoryId,
    name: name.trim(),
    description,
    price,
    isActive: isActive !== undefined ? isActive : true,
  });
};

// PUT /api/services/:id
const updateService = async (id, { categoryId, name, description, price, isActive }) => {
  const service = await Service.findById(id);
  if (!service) {
    throw createError("Service not found", 404);
  }

  // Kiểm tra tên trùng với service khác (không phải chính nó)
  if (name && name.trim() !== service.name) {
    const existing = await Service.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      throw createError("Service name already exists", 409);
    }
  }

  if (categoryId !== undefined) service.categoryId = categoryId;
  if (name !== undefined) service.name = name.trim();
  if (description !== undefined) service.description = description;
  if (price !== undefined) service.price = price;
  if (isActive !== undefined) service.isActive = isActive;

  await service.save();
};

// PUT /api/services/:id/status
const toggleServiceStatus = async (id, isActive) => {
  const service = await Service.findById(id);
  if (!service) {
    throw createError("Service not found", 404);
  }

  service.isActive = isActive;
  await service.save();
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
};
