import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BookingForm() {
  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+65 (Singapore)");
  const [mobile, setMobile] = useState("");
  const [bookingForSomeone, setBookingForSomeone] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const room = location.state?.room;
  const searchParams = location.state?.searchParams;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3002/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        firstName,
        lastName,
        email,
        countryCode,
        mobile,
        bookingForSomeone,
        room,
        searchParams,
      }),
    });
    const data = await res.json();
    navigate("/confirm", { state: { bookingId: data._id } });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>Enter your details</h2>
      <div className="form-grid">
        <select value={title} onChange={(e) => setTitle(e.target.value)}>
          <option>Mr</option>
          <option>Ms</option>
          <option>Mrs</option>
        </select>
        <input
          required
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <input
        required
        className="full-width"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        required
        className="full-width"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="form-grid">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
        >
          <option>+65 (Singapore)</option>
          <option>+1 (USA)</option>
          <option>+91 (India)</option>
        </select>
        <input
          required
          type="tel"
          placeholder="Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>
      <label>
        <input
          type="checkbox"
          checked={bookingForSomeone}
          onChange={(e) => setBookingForSomeone(e.target.checked)}
        />
        Booking for someone?
      </label>
      <button type="submit" className="next-step-btn">Next</button>
    </form>
  );
}