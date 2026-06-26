const authService = require("../services/auth.service");

const login = async (req, res) => {
  try {
    const result = await authService.login(
      req.body.username,
      req.body.password,
    );

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const result = await authService.googleLogin(req.body.googleToken);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  login,
  googleLogin,
};
