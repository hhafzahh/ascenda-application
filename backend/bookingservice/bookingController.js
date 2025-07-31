const { ObjectId } = require("mongodb");
const { getDb } = require("../Models/db");

exports.createBooking = async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection("bookings").insertOne(req.body);
    res.status(201).json(result.ops ? result.ops[0] : result);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const db = getDb();
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};
