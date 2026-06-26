require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Role = require("../models/Role");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // ==========================
    // Clear old data
    // ==========================

    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({})
    ]);

    // ==========================
    // Roles
    // ==========================

    const managerRole = await Role.create({
      roleName: "Manager",
      permissions: [
        "user.view",
        "user.create",
        "user.update",
        "user.delete",

        "role.view",
        "role.create",
        "role.update",
        "role.delete"
      ]
    });

    const receptionistRole = await Role.create({
      roleName: "Receptionist",
      permissions: []
    });

    // ==========================
    // Password = 123456
    // ==========================

    const passwordHash = await bcrypt.hash(
      "123456",
      10
    );

    // ==========================
    // Users
    // ==========================

    await User.insertMany([
      {
        username: "manager01",
        passwordHash,
        email: "manager@gmail.com",
        firstName: "Hotel",
        lastName: "Manager",
        phoneNumber: "0901234567",
        roleId: managerRole._id,
        status: "active"
      },
      {
        username: "reception01",
        passwordHash,
        email: "reception@gmail.com",
        firstName: "Reception",
        lastName: "Staff",
        phoneNumber: "0909999999",
        roleId: receptionistRole._id,
        status: "active"
      }
    ]);

    console.log("Seed completed successfully");

    console.log("\n=== TEST ACCOUNTS ===");

    console.log("\nManager");
    console.log("username: manager01");
    console.log("password: 123456");

    console.log("\nReceptionist");
    console.log("username: reception01");
    console.log("password: 123456");

    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();