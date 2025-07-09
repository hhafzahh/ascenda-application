const express = require('express');
const router = express.Router();
const axios = require('axios');

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