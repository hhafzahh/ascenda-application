import React from "react";
import { useNavigate } from "react-router-dom";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const bookingData = JSON.parse(localStorage.getItem("bookingData"));

  if (!bookingData) {
    return <p>No booking data found. Please fill out the form first.</p>;
  }

  const handleEdit = () => {
    navigate("/booking-form"); // Ensure this matches the Route path for your BookingDetailsForm
  };

  const handleProceedToPayment = () => {
    navigate("/payment");
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem" }}>
      <h2>Booking Summary</h2>

      <section>
        <h3>Personal Details</h3>
        <p><strong>Name:</strong> {bookingData.firstName} {bookingData.lastName}</p>
        <p><strong>Email:</strong> {bookingData.email}</p>
        <p><strong>Phone:</strong> {bookingData.phone}</p>
        <p><strong>Country:</strong> {bookingData.country}</p>
        <p><strong>Nationality:</strong> {bookingData.nationality}</p>
        <p><strong>ID Type:</strong> {bookingData.idType}</p>
        <p><strong>Passport/ID Number:</strong> {bookingData.passportNumber}</p>
        <p><strong>Date of Birth:</strong> {bookingData.dateOfBirth}</p>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h3>Booking Preferences</h3>
        <p><strong>Room Type:</strong> {bookingData.roomType}</p>
        <p><strong>Number of People:</strong> {bookingData.numberOfPeople}</p>
        <p><strong>Check-in Date:</strong> {bookingData.checkInDate}</p>
        <p><strong>Check-in Time:</strong> {bookingData.checkInTime}</p>
        <p><strong>Special Requests:</strong> {bookingData.specialRequests || "None"}</p>
      </section>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleEdit} style={{ marginRight: "1rem" }}>
          Edit Particulars
        </button>
        <button onClick={handleProceedToPayment}>
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
