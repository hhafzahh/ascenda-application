import React from "react";

const StarRatingFilter = ({ selectedStars, onChange }) => {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "1.25rem",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        width: "260px",
        maxWidth: "100%",
      }}
    >
      <h4
        style={{
          fontSize: "0.9rem",
          fontWeight: "700",
          marginBottom: "1rem",
          color: "#111827",
        }}
      >
        Property Rating
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {["5", "4", "3", "2", "1"].map((star) => (
          <label
            key={star}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              color: selectedStars.includes(star) ? "#0071c2" : "#374151",
              fontWeight: selectedStars.includes(star) ? "600" : "400",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              value={star}
              checked={selectedStars.includes(star)}
              onChange={onChange}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#0071c2",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            />
            <span>{star} Stars</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default StarRatingFilter;
