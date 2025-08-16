import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { FiX } from "react-icons/fi";
import MapView from "./MapView";
import HotelCard from "./HotelCard";

export default function FullMapModal({
  hotels,
  onClose,
  onMarkerClick,
  searchParams,
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // console.log(searchParams);
  return ReactDOM.createPortal(
    <div
      data-testid="full-map-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* LEFT: Hotel Cards */}
      <div
        data-testid="map-hotel-cards"
        style={{
          width: 500,
          background: "#fff",
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
        }}
      >
        {/* Close "X" Button */}
        <button
          onClick={onClose}
          style={{
            alignSelf: "flex-end",
            fontSize: "1.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Close Map"
        >
          <FiX />
        </button>

        {/* Back to Hotels Button */}
        <button
          onClick={onClose}
          style={{
            alignSelf: "flex-start",
            marginTop: 8,
            marginBottom: 20,
            backgroundColor: "#0071c2",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Back to Hotel List
        </button>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
          Available Hotels
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {hotels.map((h) => (
            <HotelCard
              key={h.id}
              hotel={h}
              searchParams={searchParams}
              id={`hotel-${h.id}`}
              isCompact={true}
            />
          ))}
        </div>
      </div>

      {/* RIGHT: Map View */}
      <div style={{ flex: 1 }}>
        <MapView hotels={hotels} onMarkerClick={onMarkerClick} height="100%" />
      </div>
    </div>,
    document.body
  );
}
