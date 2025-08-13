import React, { useEffect, useState } from "react";
import axios from "axios";
import RecentlyViewedHotelCard from "./RecentlyViewedHotelCard";
import "./RecentlyViewedHotels.css";

const DEFAULT_DEST = "WD0M";
const DEFAULT_GUESTS = "1";

const getTodayAndTomorrow = () => {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  return {
    TODAY: today.toISOString().split("T")[0],
    TOMORROW: tomorrow.toISOString().split("T")[0],
  };
};

export default function RecentlyViewedHotels() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    let viewed;
    try {
      viewed = JSON.parse(localStorage.getItem("viewedHotels") || "[]");
    } catch (error) {
      console.error("Error parsing recently viewed hotels:", error);
      return;
    }

    console.log(viewed);
    if (!viewed.length) return;

    // const raw = localStorage.getItem("lastSearchParams");
    // const last = raw ? JSON.parse(raw) : {};

    const { TODAY, TOMORROW } = getTodayAndTomorrow();

    const {
      destinationId = DEFAULT_DEST,
      checkin = TODAY,
      checkout = TOMORROW,
      guests = DEFAULT_GUESTS,
    } = viewed.find((h) => h.searchParams)?.searchParams || {};

    axios
      .get(`http://localhost:3001/api/hotelproxy/hotels/uid/${destinationId}`, {
        params: { destination_id: destinationId, checkin, checkout, guests },
      })
      .then((res) => {
        const all = Array.isArray(res.data) ? res.data : [];
        const seen = new Set(viewed.map((h) => h.id));
        const enriched = viewed.map((h) => {
          const updated = all.find((x) => x.id === h.id);
          return updated ? { ...updated, searchParams: h.searchParams } : h;
        }); //include search params with the data fetched from api

        setHotels(enriched);
      })
      .catch((err) => console.error("Error fetching hotel data:", err));
  }, []);

  if (!hotels.length) return null;

  return (
    <div
      className="recently-viewed-hotels-grid"
      data-testid="recently-viewed-hotels"
    >
      {hotels.map((hotel) => (
        <RecentlyViewedHotelCard
          key={hotel.id}
          hotel={hotel}
          data-testid="hotel-card"
        />
      ))}
      {Array.from({ length: 4 - hotels.length }).map((_, i) => (
        <div key={`placeholder-${i}`} />
      ))}
    </div>
  );
}
