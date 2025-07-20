const bookingService = require("./bookingService");

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings();
    res.json(bookings);
  } catch (err) {
    console.error("Error IN controller when fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};
