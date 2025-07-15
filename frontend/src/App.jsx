import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Booking from '../pages/Bookings'; 
import Landing from '../pages/Landing'
import './App.css';
import HotelRooms from '../pages/HotelRooms';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/bookings" element={<Booking />} />
        <Route path="/rooms" element={<HotelRooms />} />
      </Routes>
    </Router>
  );
}

export default App;