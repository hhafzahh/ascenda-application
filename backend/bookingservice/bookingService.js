const dbClient = require("../Models/db");

exports.getAllBookings = async () => {
  const db = dbClient.getDb();
  const bookings = await db.collection("bookings").find({}).toArray();
  return bookings;
};
