import { useEffect, useState } from 'react';
import axios from 'axios';

function Bookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/bookings')
      .then(res => setBookings(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Bookings</h2>
      <ul>
        {bookings.map((b, i) => (
          <li key={i}>{b.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Bookings;