import { Routes, Route } from "react-router-dom";
import Booking from "../pages/Bookings";
import Landing from "../pages/Landing";
import "./App.css";
import HotelRooms from "../pages/HotelRooms";
import SearchResults from "../pages/SearchResults";
import NavBar from "./components/NavBar";

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
        </Routes>
      </div>
    </>
  );
}

export default App;
