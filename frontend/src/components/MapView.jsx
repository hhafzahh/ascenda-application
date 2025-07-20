import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet default icon globally
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function MapView({ hotels, onMarkerClick }) {
  const validHotels = hotels?.filter(
    (hotel) =>
      hotel?.latitude !== undefined &&
      hotel?.longitude !== undefined &&
      !isNaN(hotel.latitude) &&
      !isNaN(hotel.longitude)
  ) || [];

  const center = validHotels.length > 0
    ? [validHotels[0].latitude, validHotels[0].longitude]
    : [1.3521, 103.8198]; // Default to Singapore

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <ChangeMapView center={center} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {validHotels.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[hotel.latitude, hotel.longitude]}
            eventHandlers={{
              click: () => onMarkerClick?.(hotel.id),
            }}
          >
            <Popup>
              <div style={{ padding: '5px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{hotel.name}</h4>
                <p style={{ margin: 0 }}>${hotel.price?.toFixed(2) || 'N/A'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
