// const { connect } = require('./Models/db');

// async function main() {
//      const db = await connect();
//      const bookings = db.collection('bookings');

//      const results = await bookings.find({}).toArray();

//      for (let doc of results) {
//          console.log("Name:", doc.name);
//      }

//      process.exit();
//  }

//  main().catch(err => {
//     console.error("Error:", err);
// });

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;

const { connect } = require("./Models/db");
const bookingsRouter = require("./routes/bookings");
const hotelProxyRouter = require("./routes/hotelproxy");

app.use(cors());
app.use(express.json());

app.use("/api/bookings", bookingsRouter);
app.use("/api/hotelproxy", hotelProxyRouter);

(async () => {
  try {
    await connect();
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
})();
