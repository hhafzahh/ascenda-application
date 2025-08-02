import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecentlyViewedHotelCard.css";
import { storeRecentlyViewed } from "../helper/storeRecentlyViewed"; 


const DEFAULT_DEST = "WD0M";
const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const DEFAULT_GUESTS = "1";

export default function RecentlyViewedHotelCard({ hotel }) {
  const navigate = useNavigate();

  const pre = hotel.image_details?.prefix;
  const suf = hotel.image_details?.suffix;
  const imageUrl =
    pre && suf
      ? `${pre}0${suf}`
      : hotel.default_image_index != null
      ? `${pre}${hotel.default_image_index}${suf}`
      : "https://placehold.co/600x400?text=No+Image";

  const rating = hotel.rating || 0;
  const reviewText =
    rating >= 4.5 ? "Fantastic" : rating >= 4 ? "Great" : "Good";

  const handleClick = () => {
    storeRecentlyViewed(hotel); 

    const raw = localStorage.getItem("lastSearchParams");
    const last = raw ? JSON.parse(raw) : {};
    const {
      destinationId = DEFAULT_DEST,
      checkin = TODAY,
      checkout = TOMORROW,
      guests = DEFAULT_GUESTS,
    } = last;

    navigate(`/hotels/${hotel.id}`, {
      state: {
        hotel,
        searchParams: { destinationId, checkin, checkout, guests },
      },
    });
  };

  return (
    <div className="recently-viewed-card" onClick={handleClick}>
      <img
        src={imageUrl}
        alt={hotel.name}
        className="recently-viewed-card-img"
      />

      <div className="recently-viewed-card-body">
        <h4 className="recently-viewed-title">{hotel.name}</h4>
        <p className="recently-viewed-location">{hotel.address}</p>
        <p className="recently-viewed-rating">
          <strong>{rating.toFixed(1)}</strong>/5 — {reviewText}
        </p>
      </div>

      <div className="recently-viewed-card-footer">
        <div className="price">
          {hotel.price != null
            ? `S$ ${hotel.price.toFixed(2)}`
            : "Price unavailable"}
        </div>
        <div className="subtext">Incl. taxes · Earn rewards</div>
        <button className="recently-viewed-button">See details</button>
      </div>
    </div>
  );
}
