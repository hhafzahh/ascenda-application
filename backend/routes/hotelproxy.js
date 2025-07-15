const express = require("express");
const router = express.Router();
const axios = require('axios');

router.get('/hotels/uid/:uid', async (req, res) => {
  const destinationId = req.params.uid;
  console.log("j")
  try {
    const response = await axios.get(`https://hotelapi.loyalty.dev/api/hotels`, {
      params: { destination_id: destinationId } 
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving hotels for UID', details: error.message });
  }
});

router.get('/hotels', async (req, res) => {
  try {
    const response = await axios.get('https://hotelapi.loyalty.dev/api/hotels', {
      params: req.query,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotel data', details: err.message });
  }
});
router.get("/rooms", async (req, res) => {
  try {
    const { //query parameters to destructure given request
      hotel_id,
      destination_id,
      checkin,
      checkout,
      lang,
      currency,
      country_code,
      guests,
      partner_id,
    } = req.query;

    if (!hotel_id || !destination_id || !checkin || !checkout || !guests) { //input validation
      return res.status(400).json({ error: "Missing required query params" });
    }

    const response = await axios.get( //send request to hotel API, insert hotel_id into URL path, based on previous page
      `https://hotelapi.loyalty.dev/api/hotels/${hotel_id}/price`, //get room information
      {
        params: { //forward query parameters
          destination_id,
          checkin,
          checkout,
          lang: lang || "en_US",
          currency: currency || "SGD",
          country_code: country_code || "SG",
          guests,
          partner_id: partner_id || 1,
        },
      }
    );

    res.json(response.data); //send response back to frontend
  } catch (err) {
    console.error("Error in hotel proxy:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: "Failed to fetch room prices",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
