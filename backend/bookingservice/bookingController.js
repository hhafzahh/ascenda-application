const { ObjectId } = require("mongodb");
const { getDb } = require("./database/db");

exports.createBooking = async (req, res) => {
  console.log("Received booking request:", req.body);

  try {
    const db = getDb();
    const result = await db.collection("bookings").insertOne(req.body);

    console.log("Insert result insertedId:", result.insertedId);
    console.log("InsertedId type:", typeof result.insertedId);
    console.log("InsertedId toString:", result.insertedId.toString());

    // Get the newly created booking
    const newBooking = await db.collection("bookings").findOne({
      _id: result.insertedId,
    });

    console.log("New booking created:", newBooking);
    res.status(201).json(newBooking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res
      .status(500)
      .json({ error: "Failed to create booking", details: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received booking ID:", id);
    console.log("ID type:", typeof id);
    console.log("ID length:", id ? id.length : "undefined");

    // Check if the ID is a valid ObjectId format
    if (!id || !ObjectId.isValid(id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ error: "Invalid booking ID format" });
    }

    const db = getDb();
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(id),
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    console.log("Found booking:", booking);
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};
