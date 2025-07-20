import { Routes, Route } from "react-router-dom";
import Booking from "./pages/Bookings";
import Landing from "./pages/Landing";
import "./App.css";
import HotelRooms from "./pages/HotelRooms";
import SearchResults from "./pages/SearchResults";
import NavBar from "./components/NavBar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HotelDetails from "./pages/HotelDetails/HotelDetails";
import Payment from "./pages/Payment";
import Particulars from "./pages/Particulars";
import ParticularsCheck from "./pages/ParticularsCheck";

function App() {
  return (
    <>
      <div>
        <NavBar />
        <main className="main-content"></main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/results" element={<SearchResults />} />
          <Route path="/bookings" element={<Booking />} />
          <Route path="/rooms" element={<HotelRooms />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hotels/:hotelId" element={<HotelDetails />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/booking-details" element={<Particulars />} />
          <Route path="/confirm-booking" element={<ParticularsCheck />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
