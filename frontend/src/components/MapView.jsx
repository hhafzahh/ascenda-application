import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; 
import "./pricePin.css"; 

export default function MapView({ hotels, onMarkerClick, style, height }) {
  if (!hotels || hotels.length === 0) return null;

  const avgLat = hotels.reduce((sum, h) => sum + h.latitude, 0) / hotels.length;
  const avgLng = hotels.reduce((sum, h) => sum + h.longitude, 0) / hotels.length;

  const makeIcon = (price) =>
  L.divIcon({
    html: `<div class="custom-price-pin">US$ ${price}</div>`,
    className: "", 
    iconAnchor: [20, 40], 
  });

  function ForceResize() {
    const map = useMap();
    useEffect(() => {
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }, [map]);
    return null;
  }

  return (
    <MapContainer
      center={[avgLat, avgLng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ width: "100%", height: height || 200, minHeight: 200, ...style }}
    >
      <ForceResize />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {hotels.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={makeIcon(h.price ?? "N/A")}
          eventHandlers={{
            click: () => onMarkerClick?.(h.id),
          }}
        >
          <Popup>
            <strong>{h.name}</strong>
            <br />
            S${h.price}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
