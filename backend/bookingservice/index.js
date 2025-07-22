const { connect } = require("./Models/db");
//port = 3002
const express = require("express");
const cors = require("cors");
const app = express();

const bookingsRouter = require("./bookingRoute");

app.use(cors());
app.use(express.json());

app.use("/api/bookings", bookingsRouter);
const PORT = process.env.PORT || 3002;

(async () => {
  try {
    await connect();
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Booking Service is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
})();
