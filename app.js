require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/users.routes"));
app.use("/api/service-categories", require("./src/routes/serviceCategory.routes"));
app.use("/api/services", require("./src/routes/service.routes"));
app.use("/api/room-categories", require("./src/routes/roomCategory.routes"));
app.use("/api/service-categories", require("./src/routes/serviceCategory.routes"),);
app.use("/api/rooms", require("./src/routes/room.routes"));
app.use("/api/reservations", require("./src/routes/reservation.routes"));
app.use("/api/check-outs", require("./src/routes/checkout.routes"));
app.use("/api/tickets", require("./src/routes/ticket.routes"));
app.use("/api/reports", require("./src/routes/report.routes"));


const startServer = async () => {
  await connectDB();

  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
};

startServer();
