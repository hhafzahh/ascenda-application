// import { useEffect, useState } from 'react';
// import axios from 'axios';

// function Bookings() {
//   const [bookings, setBookings] = useState([]);

//   useEffect(() => {
//     axios.get('http://localhost:3001/api/bookings')
//       .then(res => setBookings(res.data))
//       .catch(err => console.error(err));
//   }, []);

//   return (
//     <div>
//       <h2>Bookings</h2>
//       <ul>
//         {bookings.map((b, i) => (
//           <li key={i}>{b.name}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default Bookings;

import { useEffect, useState } from 'react';
import axios from 'axios';

function Booking() {
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/api/hotelproxy/hotels?destination_id=RsBU')
      .then((res) => {
        console.log('respresonse:', res.data);
        if (Array.isArray(res.data)) {
          setHotels(res.data);
        } else {
          console.error('Unexpected response format:', res.data);
          setError('Invalid data received from server.');
        }
      })
      .catch((err) => {
        console.error('API error:', err);
        setError('Failed to fetch data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>Hotels in Destinations</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading hotels...</p>}
      {!loading && Array.isArray(hotels) && hotels.length === 0 && (
        <p>No hotels found for this destination.</p>
      )}

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {Array.isArray(hotels) &&
          hotels.map((hotel, index) => (
            <li
              key={index}
              style={{
                marginBottom: '1.2rem',
                padding: '1rem',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            >
              <strong>{hotel.name || 'Unnamed Hotel'}</strong>
              <div>ID: {hotel.id}</div>
              <div>Lat/Lng: {hotel.latitude}, {hotel.longitude}</div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default Booking;