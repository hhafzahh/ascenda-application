import React, { useEffect, useState } from "react"; //to run api calls and manage state
import axios from "axios"; 
import RoomCard from "../src/RoomCard"; // Importing the RoomCard component

export default function HotelRooms() {
  const [rooms, setRooms] = useState([]); // State to hold the list of rooms
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to manage error messages

  // HARDCODED VALUES FOR TESTING
  // These values should be replaced with dynamic inputs after feature 2 is implemented
  const hotelId = "diH7";
  const destinationId = "WD0M";
  const checkin = "2025-10-11";
  const checkout = "2025-10-17";

useEffect(() => {
  const fetchRoomPrices = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/hotelproxy/rooms", {
        params: {
          hotel_id: hotelId,
          destination_id: destinationId,
          checkin,
          checkout,
          lang: "en_US",
          currency: "SGD",
          country_code: "SG",
          guests: "2",
          partner_id: 1
        },
      });
      
      console.log("Full API response:", res.data); // Debug log
      
      const roomsData = res.data.rooms || [];
      setRooms(roomsData); //save rooms data to state
      
      if (roomsData.length === 0) {
        console.warn("No rooms found in response");
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  fetchRoomPrices();
}, []);

  if (loading) {
    return <p>Loading rooms...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return ( //rendering room cards
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Rooms</h1>
      {rooms.length > 0 ? (
        rooms.map((room, index) => <RoomCard key={index} room={room} />) // Map through the rooms and render a RoomCard for each
      ) : (
        <p className="text-gray-500">No rooms available for the selected dates.</p> // If no rooms are available, display a message
      )}
    </div>
  );
}