const express = require("express");
const cors = require("cors");
const hotelRoutes = require("./hotelRoute");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/hotelproxy", hotelRoutes);

module.exports = app;