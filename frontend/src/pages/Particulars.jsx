import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BookingDetailsForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    nationality: "",
    idType: "Passport",
    passportNumber: "",
    dateOfBirth: "",
    roomType: "",
    numberOfPeople: "",
    checkInDate: "",
    checkInTime: "",
    specialRequests: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    localStorage.setItem("bookingData", JSON.stringify(formData));
    navigate("/confirm-booking");
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
      <h2>Booking Details</h2>
      <form onSubmit={handleNext}>
        <h3>Personal Information</h3>
        <input name="firstName" placeholder="First Name" required onChange={handleChange} />
        <input name="lastName" placeholder="Last Name" required onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" required onChange={handleChange} />
        <input name="phone" placeholder="Phone Number" required onChange={handleChange} />
        <input name="country" placeholder="Country of Residence" required onChange={handleChange} />
        <input name="nationality" placeholder="Nationality" required onChange={handleChange} />
        <label>ID Type:</label>
        <select name="idType" value={formData.idType} onChange={handleChange}>
          <option value="Passport">Passport</option>
          <option value="IC">Identity Card</option>
          <option value="Driver's License">Driver's License</option>
          <option value="Other">Other</option>
        </select>
        <input name="passportNumber" placeholder="Passport / ID Number" required onChange={handleChange} />
        <label>Date of Birth:</label>
        <input name="dateOfBirth" type="date" required onChange={handleChange} />

        <h3>Booking Preferences</h3>
        <input name="roomType" placeholder="Type of Room (e.g., Deluxe, Suite)" required onChange={handleChange} />
        <input name="numberOfPeople" type="number" placeholder="Number of Guests" required onChange={handleChange} />
        <label>Check-in Date:</label>
        <input name="checkInDate" type="date" required onChange={handleChange} />
        <label>Check-in Time:</label>
        <input name="checkInTime" type="time" required onChange={handleChange} />
        <textarea
          name="specialRequests"
          placeholder="Special Requests (Optional)"
          onChange={handleChange}
        />

        <button type="submit" style={{ marginTop: "1rem" }}>
          Next: Confirm Booking
        </button>
      </form>
    </div>
  );
};

export default BookingDetailsForm;
