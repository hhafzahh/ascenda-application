import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customBlueIcon = new L.Icon({
  iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -40],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

export default function MiniMap({ lat, lng, hotelName, price }) {
  if (!lat || !lng) return null;

  return (
    <div style={{ height: "200px", width: "100%", borderRadius: "10px", overflow: "hidden" }}>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={customBlueIcon}>
          <Popup>
            <b>{hotelName}</b><br />
            Price: ${price || "N/A"}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
