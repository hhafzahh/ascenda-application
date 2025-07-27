import React from "react";
import { useNavigate } from "react-router-dom";
import "./SuggestedHotelCard.css";

// Same fallback defaults:
const DEFAULT_DEST = "WD0M";
const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const DEFAULT_GUESTS = "1";

export default function SuggestedHotelCard({ hotel }) {
  const navigate = useNavigate();

  // Build the image URL
  const pre = hotel.image_details?.prefix;
  const suf = hotel.image_details?.suffix;
  const imageUrl =
    pre && suf
      ? `${pre}0${suf}`
      : hotel.default_image_index != null
      ? `${pre}${hotel.default_image_index}${suf}`
      : "https://placehold.co/600x400?text=No+Image";

  // Rating display
  const rating = hotel.rating || 0;
  const reviewText =
    rating >= 4.5 ? "Fantastic" : rating >= 4 ? "Great" : "Good";

  const handleClick = () => {
    // record view (max 4)
    const viewed = JSON.parse(localStorage.getItem("viewedHotels") || "[]");
    const exists = viewed.some((h) => h.id === hotel.id);
    const updated = exists ? viewed : [hotel, ...viewed].slice(0, 4);
    localStorage.setItem("viewedHotels", JSON.stringify(updated));

    // pull lastSearchParams or fallback
    const raw = localStorage.getItem("lastSearchParams");
    const last = raw ? JSON.parse(raw) : {};
    const {
      destinationId = DEFAULT_DEST,
      checkin = TODAY,
      checkout = TOMORROW,
      guests = DEFAULT_GUESTS,
    } = last;

    // navigate with nested searchParams
    navigate(`/hotels/${hotel.id}`, {
      state: {
        hotel,
        searchParams: { destinationId, checkin, checkout, guests },
      },
    });
  };

  return (
    <div className="suggested-card-vertical" onClick={handleClick}>
      <img
        src={imageUrl}
        alt={hotel.name}
        className="suggested-card-img-vertical"
      />

      <div className="suggested-card-body-vertical">
        <h4 className="suggested-title-vertical">{hotel.name}</h4>
        <p className="suggested-location-vertical">{hotel.address}</p>
        <p className="suggested-rating-vertical">
          <strong>{rating.toFixed(1)}</strong>/5 — {reviewText}
        </p>
      </div>

      <div className="suggested-card-footer-vertical">
        <div className="price">
          {hotel.price != null
            ? `S$ ${hotel.price.toFixed(2)}`
            : "Price unavailable"}
        </div>
        <div className="subtext">Incl. taxes · Earn rewards</div>
        <button className="suggested-button-vertical">See details</button>
      </div>
    </div>
  );
}
