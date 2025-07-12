import "../css/Booking.css";
import BookingForm from "../components/BookingForm";
import HotelDetails from "../components/HotelDetails";

export default function Booking() {
  return (
    <div className="booking-page">
      <div className="booking-left">
        <BookingForm />
      </div>
      <div className="booking-right">
        <HotelDetails />
      </div>
    </div>
  );
}
