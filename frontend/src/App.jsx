import { Routes, Route } from "react-router-dom";
import Booking from "./pages/Booking";
import Landing from "./pages/Landing";
import "./App.css";
import HotelRooms from "./pages/HotelRooms";
import SearchResults from "./pages/SearchResults";
import NavBar from "./components/NavBar/Navbar";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import HotelDetails from "./pages/HotelDetails/HotelDetails";
import Profile from "./pages/Profile";
import { useState } from "react";

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  return (
    <>
      <div>
        <NavBar />
        <main className="main-content"></main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/results" element={<SearchResults />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/rooms" element={<HotelRooms />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hotels/:hotelId" element={<HotelDetails />} />
          <Route path="/profile" element={<Profile/>} />
          {/* <Route path="/payment" element={<Payment />} />
          <Route path="/booking-details" element={<Particulars />} />
          <Route path="/confirm-booking" element={<ParticularsCheck />} /> */}
        </Routes>



      </div>
    </>
  );
}

export default App;
