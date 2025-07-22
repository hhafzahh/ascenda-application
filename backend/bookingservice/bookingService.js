const dbClient = require("./Models/db");

//gets booking from mongodb collection booking
exports.getAllBookings = async () => {
  const db = dbClient.getDb();
  const bookings = await db.collection("bookings").find({}).toArray();
  return bookings;
};
