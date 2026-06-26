const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    passwordHash: String,
    email: { type: String, unique: true },
    firstName: String,
    lastName: String,
    phoneNumber: String,
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
