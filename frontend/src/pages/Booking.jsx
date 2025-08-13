import BookingLayout from "../components/BookingLayout";
import BookingForm from "../components/BookingForm";
import { useLocation } from "react-router-dom";
import React from "react";

export default function Booking() {
  const location = useLocation();
  
  const room = location.state?.room;
  const searchParams = location.state?.searchParams;
  const hotel = location.state?.hotel;
  
  if (!room) return <p>Error: No room data provided.</p>;
  
  return (
    <BookingLayout room={room} searchParams={searchParams} hotel={hotel}>
      <BookingForm room={room} searchParams={searchParams} hotel={hotel}/>
    </BookingLayout>
  );
}