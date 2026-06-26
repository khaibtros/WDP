const RoomCategory = require("../models/RoomCategory");
const { createError } = require("../utils/error.util");

// GET /api/room-categories?keyword=
const getAllRoomCategories = async (keyword = "") => {
  const filter = keyword
    ? { name: { $regex: keyword, $options: "i" } }
    : {};

  const categories = await RoomCategory.find(filter)
    .select("_id name description basePrice maxGuests")
    .lean();

  return categories;
};

// GET /api/room-categories/:id
const getRoomCategoryById = async (id) => {
  const category = await RoomCategory.findById(id)
    .select("_id name description basePrice maxGuests amenities")
    .lean();

  if (!category) {
    throw createError("Room category not found", 404);
  }

  return category;
};

// POST /api/room-categories
const createRoomCategory = async ({ name, description, basePrice, maxGuests, amenities }) => {
  if (!name || basePrice === undefined || maxGuests === undefined) {
    throw createError("Required fields are missing", 400);
  }

  const existing = await RoomCategory.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  });

  if (existing) {
    throw createError("Room category already exists", 409);
  }

  await RoomCategory.create({
    name: name.trim(),
    description,
    basePrice,
    maxGuests,
    amenities: amenities || [],
  });
};

// PUT /api/room-categories/:id
const updateRoomCategory = async (id, { name, description, basePrice, maxGuests, amenities }) => {
  const category = await RoomCategory.findById(id);

  if (!category) {
    throw createError("Room category not found", 404);
  }

  // Kiểm tra tên trùng với category khác (không phải chính nó)
  if (name && name.trim() !== category.name) {
    const existing = await RoomCategory.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      throw createError("Room category already exists", 409);
    }
  }

  if (name !== undefined) category.name = name.trim();
  if (description !== undefined) category.description = description;
  if (basePrice !== undefined) category.basePrice = basePrice;
  if (maxGuests !== undefined) category.maxGuests = maxGuests;
  if (amenities !== undefined) category.amenities = amenities;

  await category.save();
};

module.exports = {
  getAllRoomCategories,
  getRoomCategoryById,
  createRoomCategory,
  updateRoomCategory,
};
