const express = require('express');
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
module.exports = router;
