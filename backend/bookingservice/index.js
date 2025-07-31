const express = require("express");
const app = express();
const cors = require("cors");
const { connect } = require("../Models/db");

const bookingRouter = require("./bookingRoute");
const paymentRouter = require("./paymentRoute");

app.use(cors());
app.use(express.json());

app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

// Connect to DB using shared db.js
connect()
  .then(() => {
    app.listen(3002, () => {
      console.log("Server running on http://localhost:3002");
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error", err);
  });
