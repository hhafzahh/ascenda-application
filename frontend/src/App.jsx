import { Routes, Route } from "react-router-dom";
import Booking from "./pages/Booking";
import Landing from "./pages/Landing";
import "./App.css";
import HotelRooms from "./pages/HotelRooms";
import SearchResults from "./pages/SearchResults";
import NavBar from "./components/NavBar/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HotelDetails from "./pages/HotelDetails/HotelDetails";
import Home from "./pages/Home";
import ProtectedRoute from "./ProtectedRoute";
import ConfirmPage from "./pages/Confirm";
import PaymentPage from "./pages/Payment";

function App() {
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
          <Route path="/confirmation" element={<ConfirmPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                {" "}
                <Home />{" "}
              </ProtectedRoute>
            }
          />
          {/* <Route path="/payment" element={<Payment />} />
          <Route path="/booking-details" element={<Particulars />} />
          <Route path="/confirm-booking" element={<ParticularsCheck />} /> */}
        </Routes>
      </div>
    </>
  );
}

export default App;
