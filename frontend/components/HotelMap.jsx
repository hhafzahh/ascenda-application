import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import redIconUrl from "../src/assets/marker-icon-red.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const redIcon = new L.Icon({
  iconUrl: redIconUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function HotelMap({ hotels }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !hotels.length) return;

    // Clear existing map instance if exists
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const validHotels = hotels.filter((h) => h.latitude && h.longitude);
    if (!validHotels.length) return;

    const center = [validHotels[0].latitude, validHotels[0].longitude];

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView(center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    validHotels.forEach((hotel) => {
      L.marker([hotel.latitude, hotel.longitude], { icon: redIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address || "No address"}`);
    });
  }, [hotels]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
