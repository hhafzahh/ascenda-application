import { roomAmenities } from "../config/hotel-config";
import React from "react";
const FacilitiesFilter = ({ selectedFacilities, onChange }) => {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        paddingBottom: "1.25rem",
        paddingLeft: "1.5rem",
        marginTop: "40px",
        paddingTop: "1.25rem",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        width: "260px", // or 250px for tighter layout
        maxWidth: "100%", // ensures responsiveness
        marginBottom: "20px",
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
        Room Facilities
      </h4>

      {roomAmenities.map((facility) => (
        <label
          key={facility.key}
          style={{
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            fontWeight: selectedFacilities.includes(facility.key)
              ? "600"
              : "400",
            color: selectedFacilities.includes(facility.key)
              ? "#0071c2"
              : "#374151",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            style={{
              width: "16px",
              height: "16px",
              accentColor: "#0071c2",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            value={facility.key}
            checked={selectedFacilities.includes(facility.key)}
            onChange={onChange}
          />
          <span>{facility.label} </span>
        </label>
      ))}
    </div>
  );
};

export default FacilitiesFilter;
