const userService = require("../services/user.service");

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};
const changePassword = async (req, res) => {
  try {
    await userService.changePassword(req.params.id, req.user, req.body);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(
      req.params.id,
      req.body,
      req.user,
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const getCurrentUser = async (req, res) => {
  try {
    const user = await userService.getCurrentUser(req.user.userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};
module.exports = {
  getUserById,
  changePassword,
  updateProfile,
  getCurrentUser
};
