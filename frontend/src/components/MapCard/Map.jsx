import Minimap from "../Minimap";
import React from "react";
import "./Map.css";

export default function Map({ lat, lng, hotelName, price }) {
  console.log(
    "Map component rendered with lat:",
    lat,
    "lng:",
    lng,
    "hotelName:",
    hotelName,
    "price:",
    price
  );

  // Treat null/undefined/NaN as "no coordinates"
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div className="map-container">
      <div className="map-header">
        <div className="header-text">
          <p className="header-title">On the map</p>
          <p className="subtitle">See where we're located</p>
        </div>
      </div>

      <div className="map-content">
        {hasCoordinates ? (
          <Minimap lat={lat} lng={lng} hotelName={hotelName} price={price} />
        ) : (
          <div className="map-fallback" aria-live="polite">
            No information available
          </div>
        )}
      </div>
    </div>
  );
}
