import React, { useEffect, useState } from "react";
import axios from "axios";
import RoomCard from "../components/RoomCard/RoomCard";
import Ratings from "../components/Rating/Ratings";

// HotelRooms.jsx
export default function HotelRooms({ hotelId, searchParams, hotelDetails }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("searchParams going into RoomCard:", searchParams);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3001/api/hotelproxy/rooms",
          {
            params: {
              hotel_id: hotelId,
              destination_id: searchParams.destinationId, // From props
              checkin: searchParams.checkin, // From props
              checkout: searchParams.checkout, // From props
              guests: searchParams.guests, // From props
              lang: "en_US",
              currency: "SGD",
              country_code: "SG",
              partner_id: 1,
            },
          }
        );
        setRooms(res.data.rooms || []);
      } catch (err) {
        setError("Failed to fetch rooms. Please try again.");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [hotelId, searchParams]); // Re-fetch if these change

  if (loading) return <p>Loading rooms...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      {hotelDetails && <Ratings hotel={hotelDetails} />}
      <h1 className="text-2xl font-bold mb-4">Available Rooms</h1>
      {rooms.length > 0 ? (
        rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            searchParams={searchParams}
            hotelId={hotelId}
          />
        ))
      ) : (
        <p>No rooms available for the selected dates.</p>
      )}
    </div>
  );
}
