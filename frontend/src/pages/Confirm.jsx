// Fixed Confirm.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingLayout from "../components/BookingLayout";

export default function ConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, hotel: hotelFromNav } = location.state || {}; // Get hotel from navigation
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await fetch(`http://localhost:3002/api/bookings/${bookingId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!booking) return <p>No booking found</p>;

  // Debug logs
  console.log("Confirm page - full booking object:", booking);
  console.log("Confirm page - booking.hotel:", booking.hotel);
  console.log("Confirm page - booking.room:", booking.room);
  
  // Log all properties of these objects
  if (booking.hotel) {
    console.log("booking.hotel keys:", Object.keys(booking.hotel));
    console.log("booking.hotel full object:", JSON.stringify(booking.hotel, null, 2));
  }
  if (booking.room) {
    console.log("booking.room keys:", Object.keys(booking.room));
    console.log("booking.room full object:", JSON.stringify(booking.room, null, 2));
  }

  // Try to extract hotel data from multiple possible sources
  const hotel = booking.hotel ||  // From stored booking data (preferred)
                hotelFromNav ||    // From navigation state (fallback)
                {
                  name: booking.hotelName || "Selected Hotel",
                  address: booking.hotelAddress || "Hotel Address"
                };

  return (
    <BookingLayout
      room={booking.room}
      searchParams={booking.searchParams}
      hotel={hotel}
    >
      <div className="booking-form-card">
        <div className="form-header">
          <h1>Confirm Your Booking</h1>
          <p>Please review your booking details before proceeding</p>
        </div>
        <div className="booking-form" style={{ padding: '30px' }}>
          <div className="form-section">
            <div className="section-title">
              Personal Information
            </div>
            <div className="booking-details">
              <p><strong>Name:</strong> {booking.title} {booking.firstName} {booking.lastName}</p>
              <p><strong>Email:</strong> {booking.email}</p>
              <p><strong>Phone:</strong> {booking.countryCode} {booking.mobile}</p>
              <p><strong>Booking for someone else:</strong> {booking.bookingForSomeone ? 'Yes' : 'No'}</p>
              {booking.specialRequests && (
                <p><strong>Special Requests:</strong> {booking.specialRequests}</p>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              ← Back to Edit
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/payment", { 
                state: { 
                  booking,
                  hotel: hotel // Pass hotel data to payment page
                } 
              })}
            >
              Proceed to Payment →
            </button>
          </div>
        </div>
      </div>
    </BookingLayout>
  );
}