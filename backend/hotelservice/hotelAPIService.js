const axios = require("axios");

const pollUntilCompleted = async (url, params, retries = 10, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { params });

      // Check if 'completed' is true
      if (response.data.completed) {
        return response.data;
      }
      console.log(`Attempt ${attempt}: Waiting for completion...`);
    } catch (err) {
      console.error(
        `Attempt ${attempt}: Failed to fetch data - ${err.message}`
      );
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Polling exceeded maximum retries");
};

//export only for testing purposes!
exports._test = { pollUntilCompleted };

exports.getHotelsByUid = async (req, res) => {
  const destinationId = req.params.uid;
  const { checkin, checkout, guests } = req.query;

  let hotelsMetadata = [];
  let hotelsPrices = [];

  // Fetch metadata
  try {
    const metadataResponse = await axios.get(
      "https://hotelapi.loyalty.dev/api/hotels",
      {
        params: { destination_id: destinationId },
      }
    );
    hotelsMetadata = metadataResponse.data || [];
  } catch (err) {
    console.log("Metadata fetch failed:", err.message);
  }

  // Polling to get prices until completed = true
  try {
    const pricesResponse = await pollUntilCompleted(
      "https://hotelapi.loyalty.dev/api/hotels/prices",
      {
        destination_id: destinationId,
        checkin,
        checkout,
        guests,
        partner_id: 1089,
        landing_page: "wl-acme-earn",
        product_type: "earn",
        lang: "en_US",
        currency: "USD",
        country_code: "US",
      }
    );
    hotelsPrices = pricesResponse.hotels || [];
  } catch (err) {
    console.warn("Prices fetch failed after polling:", err.message);
  }

  // If nothing fetched, return empty array instead of throwing 500
  if (!hotelsMetadata.length || !hotelsPrices.length) {
    return res.status(200).json([]);
  }

  // Merge the data from metadata and prices
  const mergedHotels = hotelsPrices.map((priceHotel) => {
    const meta = hotelsMetadata.find((h) => h.id === priceHotel.id);
    return {
      id: priceHotel.id,
      name: meta?.name,
      address: meta?.address || meta?.address1,
      rating: meta?.rating,
      image_details: meta?.image_details,
      default_image_index: meta?.default_image_index,
      trustyouScore: meta?.trustyou?.score?.kaligo_overall,
      description: meta?.description,
      amenities: meta?.amenities,
      price: priceHotel.converted_price,
      lowestPrice: priceHotel.lowest_converted_price,
      roomsAvailable: priceHotel.rooms_available,
      freeCancellation: priceHotel.free_cancellation,
      latitude: meta?.latitude,
      longitude: meta?.longitude,
    };
  });

  res.status(200).json(mergedHotels);
};

// exports.getHotelsByUid = async (req, res) => {
//   const destinationId = req.params.uid;
//   const { checkin, checkout, guests } = req.query;

//   let hotelsMetadata = [];
//   let hotelsPrices = [];

//   // Fetch metadata
//   try {
//     const metadataResponse = await axios.get(
//       "https://hotelapi.loyalty.dev/api/hotels",
//       {
//         params: { destination_id: destinationId },
//       }
//     );
//     hotelsMetadata = metadataResponse.data || [];
//   } catch (err) {
//     console.log("Metadata fetch failed:", err.message);
//   }

//   // Fetch prices
//   try {
//     const pricesResponse = await axios.get(
//       "https://hotelapi.loyalty.dev/api/hotels/prices",
//       {
//         params: {
//           destination_id: destinationId,
//           checkin,
//           checkout,
//           guests,
//           partner_id: 1089,
//           landing_page: "wl-acme-earn",
//           product_type: "earn",
//           lang: "en_US",
//           currency: "USD",
//           country_code: "US",
//         },
//       }
//     );
//     hotelsPrices = pricesResponse.data.hotels || [];
//   } catch (err) {
//     console.warn("Prices fetch failed:", err.message);
//   }

//   // If nothing fetched, return empty array instead of throwing 500
//   if (!hotelsMetadata.length || !hotelsPrices.length) {
//     return res.status(200).json([]);
//   }

//   const mergedHotels = hotelsPrices.map((priceHotel) => {
//     const meta = hotelsMetadata.find((h) => h.id === priceHotel.id);
//     return {
//       id: priceHotel.id,
//       name: meta?.name,
//       address: meta?.address || meta?.address1,
//       rating: meta?.rating,
//       image_details: meta?.image_details,
//       default_image_index: meta?.default_image_index,
//       trustyouScore: meta?.trustyou?.score?.kaligo_overall,
//       description: meta?.description,
//       amenities: meta?.amenities,
//       price: priceHotel.converted_price,
//       lowestPrice: priceHotel.lowest_converted_price,
//       roomsAvailable: priceHotel.rooms_available,
//       freeCancellation: priceHotel.free_cancellation,
//       latitude: meta?.latitude,
//       longitude: meta?.longitude,
//     };
//   });

//   res.status(200).json(mergedHotels);
// };

exports.getHotels = async (req, res) => {
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
};

exports.getRooms = async (req, res) => {
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
};

exports.getHotelByHotelId = async (req, res) => {
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
};

exports.getHotelById = async (req, res) => {
  try {
    const response = await axios.get(
      `https://hotelapi.loyalty.dev/api/hotels/${req.params.id}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving hotel details" });
  }
};
