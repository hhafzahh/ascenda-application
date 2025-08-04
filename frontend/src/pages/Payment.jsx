import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import BookingLayout from "../components/BookingLayout";
import { useLocation } from "react-router-dom";

const stripePromise = loadStripe("pk_test_51RqCRcQbesb1jJAyZJSh8M8Pg6babuFEpnOezlfOdx31JeJZnd3sKcBYHUmWYUo8bN1Bkqna8IN4ZwWBMbpI2bnj00ttxLRnub");

export default function PaymentPage() {
  const location = useLocation();
  const booking = location.state?.booking;
  const hotelFromNav = location.state?.hotel; // Get hotel from navigation

  if (!booking) {
    return <p>Error: No booking data provided.</p>;
  }

  // Debug logs
  console.log("Payment page - full booking object:", booking);
  console.log("Payment page - booking.hotel:", booking.hotel);
  console.log("Payment page - hotelFromNav:", hotelFromNav);

  // Try to extract hotel data from multiple possible sources
  const hotel = booking.hotel ||      // From stored booking data (preferred)
                hotelFromNav ||        // From navigation state (fallback)
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
      <Elements stripe={stripePromise}>
        <CheckoutForm booking={booking} />
      </Elements>
    </BookingLayout>
  );
}