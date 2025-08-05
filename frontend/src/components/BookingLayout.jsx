import React from "react";
import HotelDetails from "./HotelDetails";
import "./BookingLayout.css";

export default function BookingLayout({ children, room, searchParams, hotel }) {
  return (
    <div className="booking-layout-container">
      <div className="booking-layout">
        <div className="booking-left">
          {children}
        </div>
        <div className="booking-right">
          <HotelDetails 
            room={room} 
            searchParams={searchParams} 
            hotel={hotel}
          />
        </div>
      </div>
    </div>
  );
}