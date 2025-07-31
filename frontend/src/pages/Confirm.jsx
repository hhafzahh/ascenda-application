import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = location.state;
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      const res = await fetch(`http://localhost:3002/api/bookings/${bookingId}`);
      const data = await res.json();
      setBooking(data);
    };
    fetchBooking();
  }, [bookingId]);

  if (!booking) return <p>Loading...</p>;

  return (
    <div className="form-card">
      <h2>Confirm Your Booking</h2>
      <p><strong>Name:</strong> {booking.title} {booking.firstName} {booking.lastName}</p>
      <p><strong>Email:</strong> {booking.email}</p>
      <p><strong>Phone:</strong> {booking.countryCode} {booking.mobile}</p>
      <p><strong>Hotel:</strong> {booking.room.name}</p>
      <p><strong>Address:</strong> {booking.room.address}</p>
      <p><strong>Price:</strong> {booking.room.price} USD</p>
      <button className="next-step-btn" onClick={() => navigate("/payment", { state: { booking } })}>
        Proceed to Payment
      </button>
    </div>
  );
}