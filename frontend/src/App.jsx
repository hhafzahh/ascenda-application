import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Booking from '../pages/Bookings'; 
import Landing from '../pages/Landing'
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/bookings" element={<Booking />} />
      </Routes>
    </Router>
  );
}

export default App;