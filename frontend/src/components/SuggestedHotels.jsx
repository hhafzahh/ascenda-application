import React, { useEffect, useState } from "react";
import axios from "axios";
import SuggestedHotelCard from "./SuggestedHotelCard";
import "./SuggestedHotels.css";

// Fallback defaults:
const DEFAULT_DEST = "WD0M";
const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const DEFAULT_GUESTS = "1";

export default function SuggestedHotels() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    // load up to 4 recently viewed
    const viewed = JSON.parse(localStorage.getItem("viewedHotels") || "[]");

    // read lastSearchParams or fallback to defaults
    const raw = localStorage.getItem("lastSearchParams");
    const last = raw ? JSON.parse(raw) : {};
    const {
      destinationId = DEFAULT_DEST,
      checkin = TODAY,
      checkout = TOMORROW,
      guests = DEFAULT_GUESTS,
    } = last;

    // fetch price+metadata
    axios
      .get(`http://localhost:3001/api/hotelproxy/hotels/uid/${destinationId}`, {
        params: { 
          destination_id: destinationId, 
          checkin, 
          checkout, 
          guests,
          lang: "en_US",
          currency: "SGD",
          country_code: "SG",
          partner_id: 1,
          landing_page: "wl-acme-earn",
          product_type: "earn"
         },
      })
      .then((res) => {
        const all = Array.isArray(res.data) ? res.data : [];
        // sort by rating desc
        all.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        let list;
        if (viewed.length) {
          const seen = new Set(viewed.map((h) => h.id));
          const fallback = all.filter((h) => !seen.has(h.id)).slice(0, 4 - viewed.length);
          list = [...viewed, ...fallback];
        } else {
          list = all.slice(0, 4);
        }

        setHotels(list);
      })
      .catch((err) => console.error("Error fetching suggestions:", err));
  }, []);

  if (!hotels.length) return null;

  return (
    <div className="suggested-hotels-grid">
      {hotels.map((hotel) => (
        <SuggestedHotelCard key={hotel.id} hotel={hotel} />
      ))}
    </div>
  );
}
