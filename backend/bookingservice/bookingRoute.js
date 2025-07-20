const express = require("express");
const router = express.Router();
const bookingController = require("./bookingController");

router.get("/", bookingController.getAllBookings);

module.exports = router;
