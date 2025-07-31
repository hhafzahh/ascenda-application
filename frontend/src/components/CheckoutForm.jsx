import React from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export default function CheckoutForm({ booking }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3002/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: booking.room.price * 100 }),
    });
    const { clientSecret } = await res.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      alert("Payment failed: " + result.error.message);
    } else if (result.paymentIntent.status === "succeeded") {
      alert("Payment successful!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2>Enter Payment Details</h2>
      <CardElement />
      <button className="pay-now" type="submit">
        Pay Now
      </button>
    </form>
  );
}
