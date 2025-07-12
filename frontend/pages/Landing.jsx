// /frontend/pages/Landing.jsx
import React, { useState } from 'react';
import SearchBar from '../usage/searchBar';

export default function Landing() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="landing-container">
      <div className="search-wrapper">
        <SearchBar onHotelsFetched={setHotels} setLoading={setLoading} />
      </div>

      {loading && (
        <div className="loading-message" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p>Loading hotels...</p>
        </div>
      )}

      {hotels.length > 0 && (
        <div className="hotel-results">
          <h3>Search Results:</h3>
          <div className="hotel-card-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            {hotels.map((hotel, index) => (
              <div key={index} className="hotel-row-card" style={{
                display: 'flex',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <div style={{ width: '300px', height: '200px', flexShrink: 0 }}>
                  <img
                    src={
                      hotel.images?.[0]?.url ||
                      (hotel.image_details?.prefix && hotel.image_details?.suffix && hotel.default_image_index !== undefined
                        ? `${hotel.image_details.prefix}${hotel.default_image_index}${hotel.image_details.suffix}`
                        : 'https://via.placeholder.com/300x200?text=No+Image')
                    }
                    alt={hotel.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {hotel.name || `Unnamed Hotel (${hotel.id})`}
                  </h4>
                  <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.25rem' }}>
                    {hotel.address || 'No address available'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#777' }}>
                    {hotel.categories && typeof hotel.categories === 'object'
                      ? Object.values(hotel.categories).map((cat) => cat.name).join(', ')
                      : 'No category info'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#777' }}>
                    ⭐ {hotel.rating || 'N/A'} Star
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}