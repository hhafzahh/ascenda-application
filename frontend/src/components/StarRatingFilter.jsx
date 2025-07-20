import React from "react";

const StarRatingFilter = ({ selectedStars, onChange }) => {
  return (
    <div
      style={{
        borderBottom: "1px solid #d1d5db",
        paddingBottom: "1.25rem",
        paddingLeft: "2rem",
        paddingRight: "2rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h4
        style={{
          fontSize: "0.8rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
        }}
      >
        Property Rating
      </h4>
      {["5", "4", "3", "2", "1"].map((star) => (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
          }}
          key={star}
        >
          <input
            type="checkbox"
            style={{ borderRadius: "0.25rem" }}
            value={star}
            checked={selectedStars.includes(star)}
            onChange={onChange}
          />
          <span>{star} Stars</span>
        </label>
      ))}
    </div>
  );
};

export default StarRatingFilter;
