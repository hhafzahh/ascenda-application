import React, { useState } from "react";
import { useLocation } from "react-router-dom";

export default function PaymentPage() {
  const { state } = useLocation(); // booking details
  const [card, setCard] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const handleChange = (e) => {
    setCard({ ...card, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = { ...state, ...card };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const result = await res.json();
      alert(result.message || "Payment successful!");
    } catch (err) {
      console.error(err);
      alert("Payment failed.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2>Enter Payment Details</h2>
      <input name="cardNumber" placeholder="Card Number" required onChange={handleChange} />
      <input name="expiry" placeholder="MM/YY" required onChange={handleChange} />
      <input name="cvv" placeholder="CVV" required onChange={handleChange} />
      <button type="submit">Complete Booking</button>
    </form>
  );
}
