//HTTP Request -> Route -> Controller -> Service -> DB or API
const express = require("express");
const router = express.Router();
const hotelController = require("./hotelController");

router.get("/", (req, res) => {
  res.send("Hotel route is working!");
});

router.get("/hotels/uid/:uid", hotelController.getHotelsByUid);
router.get("/hotels", hotelController.getHotels);
router.get("/rooms", hotelController.getRooms);
router.get("/hotels/uid/:hotelId", hotelController.getHotelByHotelId);
router.get("/hotels/:id", hotelController.getHotelById);

module.exports = router;
