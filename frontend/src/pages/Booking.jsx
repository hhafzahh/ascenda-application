import "../css/Booking.css";
import BookingForm from "../components/BookingForm";
import HotelDetails from "../components/HotelDetails";
import { useLocation } from "react-router-dom";

export default function Booking() {
  const location = useLocation();
  console.log("location.state:", location.state);
  const room = location.state?.room;
  const searchParams = location.state?.searchParams;

  if (!room) return <p>Error: No room data provided.</p>;

  return (
    <div className="booking-page">
      <div className="booking-left">
        <BookingForm />
      </div>
      <div className="booking-right">
        <HotelDetails room={room} searchParams={searchParams} />
      </div>
    </div>
  );
}
