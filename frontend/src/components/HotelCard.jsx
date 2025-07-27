import React from "react";
import { useNavigate } from "react-router-dom";

export default function HotelCard({ hotel, id, isCompact = false }) {
  const imageUrl =
    hotel.image_details?.prefix && hotel.image_details?.suffix
      ? `${hotel.image_details.prefix}0${hotel.image_details.suffix}`
      : hotel.default_image_index !== undefined &&
        hotel.image_details?.prefix &&
        hotel.image_details?.suffix
      ? `${hotel.image_details.prefix}${hotel.default_image_index}${hotel.image_details.suffix}`
      : "https://placehold.co/600x400?text=No\nImage";

  const navigate = useNavigate();
  const rating = hotel.rating || "N/A";
  const trustyouScore = hotel.trustyouScore || "0";
  const reviewText = rating >= 4.5 ? "Fantastic" : rating >= 4 ? "Great" : "Good";
  const locationText = hotel.address || "Location unavailable";
  const hotelPrice = hotel.price ? `${hotel.price}` : "Price unavailable";

  return (
    <div
      id={id}
      className="hotel-card"
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        minHeight: isCompact ? "110px" : "140px",
        padding: isCompact ? "6px" : "0",
      }}
    >
      {/* Image */}
      <div style={{ width: isCompact ? "120px" : "180px", height: isCompact ? "110px" : "140px", flexShrink: 0 }}>
        <img
          src={imageUrl}
          alt={hotel.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Details */}
      <div style={{ flex: 1, padding: isCompact ? "0.5rem" : "1rem" }}>
        <h3 style={{ fontSize: isCompact ? "1rem" : "1.1rem", marginBottom: "0.25rem" }}>
          {hotel.name || `Unnamed Hotel (${hotel.id})`}
        </h3>
        <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: "0.25rem" }}>
          📍 {locationText}
        </div>
        {hotel.bookingStats && (
          <div style={{ fontSize: "0.75rem", color: "#777" }}>{hotel.bookingStats}</div>
        )}
        {hotel.promoText && (
          <div style={{ fontSize: "0.75rem", color: "#d9534f", fontWeight: "bold" }}>
            {hotel.promoText}
          </div>
        )}
      </div>

      {/* Price + Button */}
      <div
        style={{
          padding: isCompact ? "0.5rem" : "1rem",
          minWidth: isCompact ? "90px" : "120px",
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontWeight: "bold", fontSize: isCompact ? "0.95rem" : "1rem" }}>{hotelPrice}</div>
          <div style={{ fontSize: "0.7rem", color: "#777" }}>Incl. taxes</div>
          <div style={{ fontSize: "0.7rem", color: "#777" }}>Earn rewards</div>
        </div>
        <div style={{ marginTop: "0.3rem" }}>
          <span
            style={{
              backgroundColor: "#3a4ccf",
              color: "#fff",
              fontSize: "0.7rem",
              borderRadius: "4px",
              padding: "2px 5px",
              marginRight: "0.4rem",
              fontWeight: "bold",
            }}
          >
            {rating}/5
          </span>
          <span style={{ fontSize: "0.75rem", color: "#0071c2", marginRight: "0.25rem" }}>{reviewText}</span>
        </div>
        <button
          onClick={() => {
            const viewed = JSON.parse(localStorage.getItem("viewedHotels") || "[]");
            const already = viewed.some((h) => h.id === hotel.id);
            const updated = already ? viewed : [hotel, ...viewed].slice(0, 4);
            localStorage.setItem("viewedHotels", JSON.stringify(updated));
            navigate(`/hotels/${hotel.id}`, { state: { hotel } });
          }}
          style={{
            backgroundColor: "#ff5a5f",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "0.4rem",
            fontSize: "0.8rem",
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
