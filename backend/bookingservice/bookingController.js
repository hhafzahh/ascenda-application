const { ObjectId } = require("mongodb");
const { getDb } = require("./database/db");

exports.createBooking = async (req, res) => {
  console.log("Received booking request:", req.body);

  try {
    const db = getDb();
    
    // userId as string for consistent searching
    const bookingData = { ...req.body };
    
    // userId is stored as string
    if (bookingData.userId) {
      bookingData.userId = bookingData.userId.toString();
    }
    
    
    bookingData.createdAt = new Date();
    bookingData.status = bookingData.status || "confirmed";
    
    console.log('Saving booking with userId (string):', bookingData.userId);
    
    const result = await db.collection("bookings").insertOne(bookingData);
    
    console.log('Insert result insertedId:', result.insertedId);
    
    // To get the newly created booking
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
    console.log('Received booking ID:', id);
    
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

exports.getBookingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching bookings for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const db = getDb();
    
    // Search using userId as string (consistent)
    const bookings = await db.collection("bookings").find({
      userId: userId.toString()
    }).sort({ createdAt: -1 }).toArray();

    console.log(`Found ${bookings.length} bookings for user ${userId}`);
    console.log('Bookings found:', bookings.map(b => ({ id: b._id, firstName: b.firstName, userId: b.userId })));
    
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};
