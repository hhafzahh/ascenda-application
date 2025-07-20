//express app entry for hotel service
console.log("Starting HotelService...");
const express = require("express");
const cors = require("cors");
const app = express();

const hotelProxyRouter = require("./hotelRoute");

app.use(cors());
app.use(express.json());

app.use("/api/hotelproxy", hotelProxyRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Hotel Service is running on http://localhost:${PORT}`);
});
