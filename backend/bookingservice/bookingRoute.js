const express = require("express");
const router = express.Router();
const bookingController = require("./bookingController");

router.post("/", bookingController.createBooking);
router.get("/:id", bookingController.getBookingById);
router.get("/user/:userId", bookingController.getBookingsByUserId);

module.exports = router;
