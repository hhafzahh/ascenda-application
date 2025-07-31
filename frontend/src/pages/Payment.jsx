import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import { useLocation } from "react-router-dom";

const stripePromise = loadStripe("pk_test_51RqCRcQbesb1jJAyZJSh8M8Pg6babuFEpnOezlfOdx31JeJZnd3sKcBYHUmWYUo8bN1Bkqna8IN4ZwWBMbpI2bnj00ttxLRnub");

export default function PaymentPage() {
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm booking={booking} />
    </Elements>
  );
}