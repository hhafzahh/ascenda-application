import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import HotelOverview from "../../components/HotelOverview";
import HotelRooms from "../HotelRooms";
import PhotoGallery from "../../components/PhotoGallery/PhotoGallery";
import "../HotelDetails/HotelDetails.css"; 

export default function HotelDetails() {
  const location = useLocation();
  const { hotelId } = useParams();
  const { hotel, searchParams, fromBooking } = location.state || {}; 
  const roomRef = useRef(null);
  const [fullHotel, setFullHotel] = useState(hotel || null);

  const scrollToRooms = () => {
    roomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  console.log('HotelDetails - Hotel ID from URL:', hotelId);
  console.log('HotelDetails - From booking:', fromBooking);
  console.log('HotelDetails - Initial hotel:', hotel);

  return (
    <div className="hotel-details-page" style ={{ width:'100%', margin: 'auto'}} >
      <div className="hotel-details-content">
        <HotelOverview 
          hotel={fullHotel} 
          onSelectRoom={scrollToRooms} 
        />
        <div ref={roomRef}>
          <HotelRooms
            hotelId={hotelId}
            searchParams={searchParams}
            hotelDetails={fullHotel}
          />
        </div>
      </div>
    </div>
  );
}