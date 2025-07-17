import React, { useEffect, useState } from "react";
import axios from "axios"; 
import RoomCard from "../src/RoomCard";
import Ratings from "../src/Ratings";

export default function HotelRooms() {
  const [rooms, setRooms] = useState([]);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // HARDCODED VALUES FOR TESTING
  const hotelId = "diH7";
  const destinationId = "WD0M";
  const checkin = "2025-10-11";
  const checkout = "2025-10-17";
  const guests = "2";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelRes, roomsRes] = await Promise.all([
          axios.get(`http://localhost:3001/api/hotelproxy/hotels/${hotelId}`),
          axios.get("http://localhost:3001/api/hotelproxy/rooms", {
            params: {
              hotel_id: hotelId,
              destination_id: destinationId,
              checkin,
              checkout,
              lang: "en_US",
              currency: "SGD",
              country_code: "SG",
              guests,
              partner_id: 1,
            },
          }),
        ]);

        setHotelDetails(hotelRes.data);
        setRooms(roomsRes.data.rooms || []);
      } catch (err) {
        console.error("Error fetching hotel or rooms data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading rooms...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      {hotelDetails && <Ratings hotel={hotelDetails} />}
      <h1 className="text-2xl font-bold mb-4">Available Rooms</h1>
      {rooms.length > 0 ? (
        rooms.map((room, index) => <RoomCard key={index} room={room} />)
      ) : (
        <p className="text-gray-500">No rooms available for the selected dates.</p>
      )}
    </div>
  );
}
