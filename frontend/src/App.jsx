import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Booking from '../pages/Bookings'; 
import Landing from '../pages/Landing'
import './App.css';
import HotelRooms from '../pages/HotelRooms';
import HotelDetails from '../pages/HotelDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/bookings" element={<Booking />} />
        <Route path="/rooms" element={<HotelRooms />} />
        <Route path="/hotels/:hotelId" element={<HotelDetails />} />
      </Routes>
    </Router>
  );
}

export default App;