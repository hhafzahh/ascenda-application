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
  const { hotel, searchParams } = location.state || {}; 
  const roomRef = useRef(null);

  const scrollToRooms = () => {
    roomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!hotel) return <p>Loading...</p>;

  return (
    <div className="hotel-details-page" style ={{ width:'100%', margin: 'auto'}} >
      <PhotoGallery hotel={hotel} />
      <div className="hotel-details-content">
        <HotelOverview hotel={hotel} onSelectRoom={scrollToRooms} />
        <div ref={roomRef}>
          {/* Pass searchParams to HotelRooms */}
          <HotelRooms
            hotelId={hotelId}
            searchParams={searchParams}
            hotelDetails={hotel}
          />
        </div>
      </div>
    </div>
  );
}