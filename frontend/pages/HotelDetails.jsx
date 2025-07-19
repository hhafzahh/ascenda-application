import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import HotelOverview from "../components/HotelOverview";
import HotelRooms from "../pages/HotelRooms";
import PhotoGallery from "../components/PhotoGallery";
import "./HotelDetails.css"; // Ensure you have styles for the hotel details page

export default function HotelDetails() {
  const location = useLocation();
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(location.state?.hotel || null);
  const roomRef = useRef(null); // 👈 create ref

  const scrollToRooms = () => {
    roomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Optional: fallback to fetch if not passed
  // this is commented as its not working even if api is changed to localhost...
  // useEffect(() => {
  // if (!hotel) {
  //     async function fetchHotel() {
  //     const response = await fetch(`https://your-api.com/hotels/${hotelId}`);
  //     const data = await response.json();
  //     setHotel(data);
  //     }
  //     fetchHotel();
  // }
  // }, [hotel, hotelId]);

  if (!hotel) {
    return <p>Loading...</p>;
  }

  return (
    <div className="hotel-details-page">
      <PhotoGallery hotel={hotel} />
      <div className="hotel-details-content">
        <HotelOverview hotel={hotel} onSelectRoom={scrollToRooms} />
        <div ref={roomRef}>
          <HotelRooms hotelId={hotelId} />
        </div>
      </div>
    </div>
  );
}
