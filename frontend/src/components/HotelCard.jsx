import React from "react";
import { useNavigate } from "react-router-dom";

export default function HotelCard({ hotel }) {
  const imageUrl =
    hotel.image_details?.prefix && hotel.image_details?.suffix
      ? `${hotel.image_details.prefix}0${hotel.image_details.suffix}` // Try 0.jpg first
      : hotel.default_image_index !== undefined &&
        hotel.image_details?.prefix &&
        hotel.image_details?.suffix
      ? `${hotel.image_details.prefix}${hotel.default_image_index}${hotel.image_details.suffix}` // Fallback to default_image_index
      : "https://placehold.co/600x400?text=No\nImage"; // Fallback to placeholder

  const categories =
    hotel.categories && typeof hotel.categories === "object"
      ? Object.values(hotel.categories)
          .map((cat) => cat.name)
          .join(", ")
      : "";

  const navigate = useNavigate();

  const rating = hotel.rating || "N/A";
  const trustyouScore = hotel.trustyouScore || "0";
  const reviewText =
    rating >= 4.5 ? "Fantastic" : rating >= 4 ? "Great" : "Good";

  const locationText = hotel.address || "Location unavailable";

  const hotelPrice = hotel.price ? `${hotel.price}` : "Price unavailable";

  return (
    <div
      className="hotel-card"
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* Left: Image */}
      <div style={{ width: "160px", height: "160px", flexShrink: 0 }}>
        <img
          src={imageUrl}
          alt={hotel.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Center: Details */}
      <div style={{ flex: 1, padding: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
          {hotel.name || `Unnamed Hotel (${hotel.id})`}
        </h3>

        <div
          style={{
            fontSize: "0.85rem",
            color: "#555",
            marginBottom: "0.25rem",
          }}
        >
          📍 {locationText}{" "}
          <a href="#" style={{ color: "#0071c2" }}>
            See map
          </a>
        </div>
        {hotel.bookingStats && (
          <div style={{ fontSize: "0.8rem", color: "#777" }}>
            {hotel.bookingStats}
          </div>
        )}
        {hotel.promoText && (
          <div
            style={{ fontSize: "0.8rem", color: "#d9534f", fontWeight: "bold" }}
          >
            {hotel.promoText}
          </div>
        )}
      </div>

      {/* Right: Price & Action */}
      <div
        style={{
          padding: "1rem",
          minWidth: "120px",
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontWeight: "bold", fontSize: "1rem" }}>
            {hotelPrice}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#777" }}>Incl. taxes</div>
          <div style={{ fontSize: "0.75rem", color: "#777" }}>Earn rewards</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "0.25rem",
          }}
        >
          <span
            style={{
              backgroundColor: "#3a4ccf",
              color: "#fff",
              fontSize: "0.75rem",
              borderRadius: "4px",
              padding: "0.1rem 0.4rem",
              marginRight: "2rem",
              fontWeight: "bold",
            }}
          >
            {rating}/5
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              color: "#0071c2",
              marginRight: "0.5rem",
            }}
          >
            {reviewText}
          </span>
          <span style={{ fontSize: "0.8rem", color: "#555" }}>
            {trustyouScore} score
          </span>
        </div>
        <button
          onClick={() => {
            console.log("Navigating with hotel:", hotel);
            navigate(`/hotels/${hotel.id}`, { state: { hotel } });
          }}
          style={{
            backgroundColor: "#ff5a5f",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          See details
        </button>
      </div>
    </div>
  );
}
