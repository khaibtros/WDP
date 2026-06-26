const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { createError } = require("../utils/error.util");

const getUserById = async (userId, currentUser) => {
  if (!userId) {
    throw createError("User ID is required", 400);
  }

  if (!currentUser) {
    throw createError("Unauthorized", 401);
  }

  if (currentUser.userId !== userId && currentUser.role !== "Manager") {
    throw createError("Forbidden", 403);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw createError("User not found", 404);
  }

  return user;
};

const changePassword = async (userId, currentUser, body) => {
  if (currentUser.userId !== userId) {
    throw createError("Forbidden", 403);
  }

  const { currentPassword, newPassword, confirmPassword } = body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw createError("All fields are required", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw createError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isMatch) {
    throw createError("Current password is incorrect", 400);
  }

  if (newPassword !== confirmPassword) {
    throw createError("Password confirmation does not match", 400);
  }

  if (currentPassword === newPassword) {
    throw createError(
      "New password must be different from current password",
      400,
    );
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);

  await user.save();

  return true;
};

const updateProfile = async (userId, body, currentUser) => {
  if (currentUser.userId !== userId && currentUser.role !== "Manager") {
    throw createError("Forbidden", 403);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw createError("User not found", 404);
  }

  if (body.email && body.email !== user.email) {
    const existedEmail = await User.findOne({
      email: body.email,
    });

    if (existedEmail) {
      throw createError("Email already exists", 409);
    }
  }

  if (body.phoneNumber && !/^[0-9]{10,11}$/.test(body.phoneNumber)) {
    throw createError("Invalid phone number", 400);
  }

  if (body.email !== undefined) user.email = body.email;

  if (body.firstName !== undefined) user.firstName = body.firstName;

  if (body.lastName !== undefined) user.lastName = body.lastName;

  if (body.phoneNumber !== undefined) user.phoneNumber = body.phoneNumber;

  user.updatedAt = new Date();

  await user.save();

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
  };
};
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).populate("roleId");

  return user;
};

module.exports = {
  getUserById,
  changePassword,
  updateProfile,
  getCurrentUser,
};
