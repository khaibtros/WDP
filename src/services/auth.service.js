require("../models/Role");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt.util");
const { verifyGoogleToken } = require("../config/googleAuth");
const {createError} = require("../utils/error.util")


const login = async (username, password) => {
  if (!username || !password) {
    throw createError("Username and password are required", 400);
  }

  const user = await User.findOne({ username }).populate("roleId");

  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw createError("Invalid credentials", 401);
  }

  const token = generateToken(user);

  return {
    success: true,
    token,
    userId: user._id,
    user,
  };
};

const googleLogin = async (googleToken) => {
  if (!googleToken) {
    throw createError("Google token is required", 400);
  }

  let payload;

  try {
    payload = await verifyGoogleToken(googleToken);
  } catch (err) {
    throw createError("Invalid Google token", 401);
  }

  const user = await User.findOne({
    email: payload.email,
  }).populate("roleId");

  if (!user) {
    throw createError("User not found", 404);
  }

  const token = generateToken(user);

  return {
    success: true,
    token,
    userId: user._id,
    user,
  };
};

module.exports = {
  login,
  googleLogin,
};
