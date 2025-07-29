import React, { useEffect, useState } from "react";
import axios from "axios";
import RoomCard from "../components/RoomCard/RoomCard";
import Ratings from "../components/Rating/Ratings";

export default function HotelRooms({ hotelId, searchParams, hotelDetails}) {
  const [rooms, setRooms] = useState([]);
  const [hotelMetadata, setHotelMetadata] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetched,setFetched] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 4; // Number of rooms per page

  // Fetch hotel metadata and rooms based on hotelId and searchParams
  useEffect(() => {
    const fetchHotelMetadata = async () => {
      setLoading(true);
      try {
        const metaRes = await axios.get('http://localhost:3001/api/hotelproxy/hotels', {
          params: { destination_id: searchParams.destinationId },
        });
        const hotel = metaRes.data.find(h => h.id === hotelId);
        setHotelMetadata(hotel || null);
      } catch (err) {
        console.error("Failed to fetch hotel metadata:", err);
      }
    };

    const fetchRooms = async () => {
      try {
        const roomsRes = await axios.get('http://localhost:3001/api/hotelproxy/rooms', {
          params: {
            hotel_id: hotelId,
            destination_id: searchParams.destinationId,
            checkin: searchParams.checkin,
            checkout: searchParams.checkout,
            guests: searchParams.guests,
            lang: 'en_US',
            currency: 'SGD',
            country_code: 'SG',
            partner_id: 1,
          },
        });
        setRooms(roomsRes.data.rooms || []);
        setCurrentPage(1); // Reset to first page on new fetch
      } catch (err) {
        setError("Failed to fetch rooms. Please try again.");
        console.error("API Error:", err);
      } finally {
        setFetched(true);
        
      } 
    };

    setLoading(true);
    Promise.all([fetchHotelMetadata(), fetchRooms()]).finally(() => setLoading(false));
  }, [hotelId, searchParams]);

   // Pagination logic
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(rooms.length / roomsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return; // Prevent out-of-bounds
    setCurrentPage(page);}

  if (loading) return <p>Loading rooms...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
  <div className="p-6">
    {/* Guest ratings and amenities score */}
    {hotelMetadata && (
      <Ratings 
        hotel={{ 
          ...hotelMetadata, 
          rating: hotelMetadata.trustyou?.score?.kaligo_overall ?? hotelMetadata.rating
        }} 
      />
    )}
    <h1 className="p-6 space-y-6">Available Rooms</h1>
    {rooms === null ? null : (
      fetched ? (
        rooms.length > 0 ? (
          currentRooms.map((room) => <RoomCard key={room.id} room={room} searchParams={searchParams} hotelId={hotelId}/>)
        ) : (
          <p>No rooms available for the selected dates.</p>
        )
      ) : null
    )}

    {/* Pagination controls */}
    {totalPages > 1 && (
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            backgroundColor: "#007BFF"
          }}
        >
          Previous
        </button>
        <span
        style={{
          padding: "0.5rem 1rem",
        }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            backgroundColor: "#007BFF"
          }}
        >
          Next
        </button>
      </div>
    )}
  </div>
);
}

