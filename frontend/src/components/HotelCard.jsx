import React, { useState } from "react";
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

  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const rating = hotel.rating || "N/A";
  const trustyouScore = hotel.trustyouScore || "0";
  const reviewText =
    rating >= 4.5 ? "Fantastic" : rating >= 4 ? "Great" : "Good";
  const locationText = hotel.address || "Location unavailable";
  const hotelPrice = hotel.price ? `${hotel.price}` : "Price unavailable";

  return (
    <div
      id={id}
      className="hotel-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        border: "1px solid #ddd",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor: "#fff",
        padding: "12px",
        boxShadow: isHovered
          ? "0 4px 12px rgba(58, 76, 207, 0.4)"
          : "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* Left: Image */}
      <div
        style={{
          width: isCompact ? "150px" : "220px",
          height: isCompact ? "140px" : "160px",
          flexShrink: 0,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <img
          src={imageUrl}
          alt={hotel.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Middle: Content */}
      <div
        style={{
          flex: 1,
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          textAlign: "left",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: isCompact ? "1.1rem" : "1.2rem",
              marginBottom: "0.4rem",
              color: "#111",
            }}
          >
            {hotel.name || `Unnamed Hotel (${hotel.id})`}
          </h3>

          <div
            style={{
              fontSize: "0.85rem",
              color: "#555",
              marginBottom: "0.4rem",
            }}
          >
            📍 {locationText}
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                marginBottom: "0.3rem",
              }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const full = Math.floor(rating);
                const half = rating - full >= 0.5;
                if (i < full) {
                  return (
                    <span
                      key={i}
                      style={{ color: "#febb02", fontSize: "1rem" }}
                    >
                      ★
                    </span>
                  );
                } else if (i === full && half) {
                  return (
                    <span
                      key={i}
                      style={{ color: "#febb02", fontSize: "1rem" }}
                    >
                      &#xf123;
                    </span>
                  );
                } else {
                  return (
                    <span key={i} style={{ color: "#ccc", fontSize: "1rem" }}>
                      ☆
                    </span>
                  );
                }
              })}
            </div>

            {/* <div
              style={{
                fontSize: "0.75rem",
                color: "#0071c2",
                marginBottom: "0.2rem",
              }}
            >
              {reviewText}
            </div>
            <div style={{ fontSize: "0.7rem", color: "green" }}>
              Guests Rating: {trustyouScore}/5
            </div> */}
          </div>
        </div>
      </div>

      {/* Right: Price + Button */}
      <div
        style={{
          minWidth: "140px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-end",
          textAlign: "right",
        }}
      >
        {/* ✅ Guest Rating Side-by-Side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#111" }}
          >
            {reviewText}
          </div>
          <div
            style={{
              backgroundColor: "#003580",
              color: "#fff",
              fontSize: "0.8rem",
              borderRadius: "4px",
              padding: "4px 8px",
              fontWeight: "bold",
            }}
          >
            {trustyouScore}/5
          </div>
        </div>

        {/* 💰 Price */}
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              color: "#000",
              marginBottom: "0.2rem",
            }}
          >
            SGD {hotelPrice}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#777" }}>
            Exclude taxes & fees
          </div>
        </div>

        {/* 🔘 Button */}
        <button
          onClick={() => {
            const viewed = JSON.parse(
              localStorage.getItem("viewedHotels") || "[]"
            );
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
          }}
        >
          See details
        </button>
      </div>
    </div>
  );
}
