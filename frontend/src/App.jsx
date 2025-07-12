import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Booking from '../pages/Bookings'; 
import './App.css';
import HotelRooms from '../pages/HotelRooms';

function Home() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Hotel Booking App</h1>
      <button onClick={() => navigate('/bookings')}>
        View Bookings
      </button>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bookings" element={<Booking />} />
        <Route path="/rooms" element={<HotelRooms />} />
      </Routes>
    </Router>
  );
}

export default App;