// HotelDetails.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import HotelOverview from "../../components/HotelOverview/HotelOverview";
import HotelRooms from "../HotelRooms";
import PhotoGallery from "../../components/PhotoGallery/PhotoGallery";
import "../HotelDetails/HotelDetails.css";

export default function HotelDetails() {
  const location = useLocation();
  const { hotelId } = useParams();
  const roomRef = useRef(null);

  const passedHotel = location.state?.hotel;
  const searchParams = location.state?.searchParams;

  const [hotel, setHotel] = useState(passedHotel || null);
  const [hotelMetadata, setHotelMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const scrollToRooms = () => {
    roomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        if (!hotel) {
          const hotelRes = await axios.get(
            `http://localhost:3001/api/hotelproxy/hotels/uid/${hotelId}`
          );
          setHotel(hotelRes.data);
        }

        if (searchParams?.destinationId) {
          const metaRes = await axios.get(
            `http://localhost:3001/api/hotelproxy/hotels`,
            {
              params: { destination_id: searchParams.destinationId },
            }
          );

          const metadata = metaRes.data.find((h) => h.id === hotelId);
          setHotelMetadata(metadata || null);
        }
      } catch (err) {
        setError("Failed to load hotel information.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [hotelId]);

  if (loading) return <p>Loading hotel details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!hotel) return <p>No hotel data found.</p>;

  return (
    <div
      className="hotel-details-page"
      style={{ width: "100%", margin: "auto", paddingTop: "15px" }}
    >
      <PhotoGallery hotel={hotel} />
      <div className="hotel-details-content">
        <HotelOverview
          hotel={hotel}
          hotelMetadata={hotelMetadata}
          onSelectRoom={scrollToRooms}
        />
        <div ref={roomRef}>
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
