import React, { useEffect, useState } from "react";
import axios from "axios";
import RoomCard from "../components/RoomCard/RoomCard";
import Ratings from "../components/Rating/Ratings";
import { set } from "lodash";

// HotelRooms.jsx
export default function HotelRooms({ hotelId, searchParams, hotelDetails }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false); // To track if rooms have been fetched

  //for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 3; // Number of rooms per page

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
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
        setCurrentPage(1); // Reset to first page on new fetch
      } catch (err) {
        setError("Failed to fetch rooms. Please try again.");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    };

    fetchRooms();
  }, [hotelId, searchParams]); // Re-fetch if these change

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
  <>
    <div className="p-6">
      {hotelDetails && <Ratings hotel={hotelDetails} />}
      <h1 className="text-2xl font-bold mb-4">Available Rooms</h1>
      {fetched ? (rooms.length > 0 ? (
        currentRooms.map((room) => <RoomCard key={room.id} room={room} />)
      ) : (
        <p>No rooms available for the selected dates.</p>
      )
      ): null}
    </div>

    <div className="flex justify-center mt-4 space-x-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => handlePageChange(i + 1)}
          className={currentPage === i + 1 ? "font-bold underline" : ""}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  </>
);

}
