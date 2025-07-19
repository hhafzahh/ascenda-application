const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/hotels/uid/:uid", async (req, res) => {
  const destinationId = req.params.uid;
  const { checkin, checkout, guests } = req.query;

  try {
    // fetch hotel data
    const metadataResponse = await axios.get(
      "https://hotelapi.loyalty.dev/api/hotels",
      {
        params: { destination_id: destinationId },
      }
    );
    const hotelsMetadata = metadataResponse.data || [];

    // fetch hotel prices/availability
    const pricesResponse = await axios.get(
      "https://hotelapi.loyalty.dev/api/hotels/prices",
      {
        params: {
          destination_id: destinationId,
          checkin,
          checkout,
          guests,
          partner_id: 1,
          lang: "en_US",
          currency: "USD",
          country_code: "US",
        },
      }
    );
    const hotelsPrices = pricesResponse.data.hotels || [];

    // 3️⃣ Merge metadata and prices by `id`
    const mergedHotels = hotelsPrices.map((priceHotel) => {
      const meta = hotelsMetadata.find((h) => h.id === priceHotel.id);
      // console.log("hi");
      // console.log(meta);
      return {
        id: priceHotel.id,
        name: meta?.name,
        address: meta?.address || meta?.address1,
        rating: meta?.rating,
        image_details: meta?.image_details,
        default_image_index: meta?.default_image_index,
        // imageDetails: meta?image_details || null
        trustyouScore: meta?.trustyou?.score?.overall,
        description: meta?.description,
        amenities: meta?.amenities,
        price: priceHotel.converted_price,
        lowestPrice: priceHotel.lowest_converted_price,
        roomsAvailable: priceHotel.rooms_available,
        freeCancellation: priceHotel.free_cancellation,
      };
    });

    res.status(200).json(mergedHotels);
  } catch (error) {
    console.error("Error merging hotel metadata and prices:", error.message);
    res.status(500).json({
      error: "Error retrieving combined hotel data",
      details: error.message,
    });
  }
});

router.get("/hotels", async (req, res) => {
  try {
    const response = await axios.get(
      "https://hotelapi.loyalty.dev/api/hotels",
      {
        params: req.query,
      }
    );
    res.json(response.data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch hotel data", details: err.message });
  }
});

router.get("/rooms", async (req, res) => {
  try {
    const {
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

    if (!hotel_id || !destination_id || !checkin || !checkout || !guests) {
      return res.status(400).json({ error: "Missing required query params" });
    }

    // Fetch room price data
    const priceRes = await axios.get(
      `https://hotelapi.loyalty.dev/api/hotels/${hotel_id}/price`,
      {
        params: {
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

    // Fetch hotel-level info from the /api/hotels endpoint
    const hotelListRes = await axios.get(
      `https://hotelapi.loyalty.dev/api/hotels`,
      {
        params: { destination_id },
      }
    );

    const hotelInfo = hotelListRes.data.find((h) => h.id === hotel_id);

    res.json({
      ...priceRes.data,
      hotel: hotelInfo || null, // attach hotel info separately
    });
  } catch (err) {
    console.error("Error in hotel proxy:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: "Failed to fetch room prices",
      details: err.response?.data || err.message,
    });
  }
});

router.get("/hotels/uid/:hotelId", async (req, res) => {
  const hotelId = req.params.hotelId;

  try {
    const response = await axios.get(
      `https://hotelapi.loyalty.dev/api/hotels`,
      {
        params: {
          hotel_id: hotelId,
          lang: "en_US",
          currency: "SGD",
          country_code: "SG",
        },
      }
    );

    if (response.data && response.data.length > 0) {
      res.status(200).json(response.data[0]); // return first match
    } else {
      res.status(404).json({ error: "Hotel not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error retrieving hotel info", details: error.message });
  }
});

//used by rooms
router.get("/hotels/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://hotelapi.loyalty.dev/api/hotels/${req.params.id}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving hotel details" });
  }
});

module.exports = router;
