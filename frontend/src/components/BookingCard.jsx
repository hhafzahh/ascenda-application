import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoomCard/RoomCard.css"; // Reuse RoomCard styles

export default function BookingCard({ booking }) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Debug
  // console.log("BookingCard - Full booking object:", booking);
  // console.log("BookingCard - booking.hotel:", booking.hotel);
  // console.log("BookingCard - booking.hotelId:", booking.hotelId);
  // console.log("BookingCard - booking.hotelName:", booking.hotelName);

  // Handles both booking formats (from booking form vs from database)
  const hotel = booking.hotel || {
    id: booking.hotelId || booking.hotel?.id || booking.hotel?._id,
    name:
      booking.hotelName || booking.hotel?.name || "Hotel Name Not Available",
    address:
      booking.hotelAddress || booking.hotel?.address || "Address Not Available",
    images: booking.hotel?.images || [],
  };

  // console.log("BookingCard - Constructed hotel object:", hotel);
  // console.log("BookingCard - Final hotel.id that will be used:", hotel.id);

  const room = booking.room || {
    roomDescription: "Room details not available",
    converted_price: booking.totalPrice || 0,
    amenities: [],
    images: [],
  };

  const searchParams = booking.searchParams || {
    checkIn: booking.checkIn || "Date not available",
    checkOut: booking.checkOut || "Date not available",
    guests: booking.guests || 1,
    destinationId: booking.destinationId || booking.searchParams?.destinationId,
  };

  // Calculate number of nights
  let nights = 1;
  let totalPrice = "0.00";

  try {
    if (searchParams.checkIn && searchParams.checkOut) {
      const checkInDate = new Date(searchParams.checkIn);
      const checkOutDate = new Date(searchParams.checkOut);
      nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      nights = nights > 0 ? nights : 1; // Ensure at least 1 night
    }

    const pricePerNight = room.converted_price || room.price || 0;
    totalPrice = (pricePerNight * nights).toFixed(2);
  } catch (error) {
    console.error("Error calculating price:", error);
  }

  // Carousel functionality
  const nextImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const handleViewHotel = () => {
    // Get the correct hotel ID
    const correctHotelId = booking.hotel?.id || booking.hotelId;

    console.log("Navigating to hotel with ID:", correctHotelId);
    console.log("Hotel from booking:", booking.hotel);

    if (correctHotelId) {
      // Navigate to hotel details
      navigate(`/hotels/${correctHotelId}`, {
        state: {
          searchParams: booking.searchParams, // Pass search params so it can fetch full data
          fromBooking: true, // Flag to indicate this came from a booking
        },
      });
    } else {
      alert("Hotel ID not found");
    }
  };

  const images =
    hotel.images?.length > 0
      ? hotel.images
      : room.images?.length > 0
      ? room.images
      : [];

  const formattedImages = images
    .map((img) => (typeof img === "string" ? img : img?.url || img))
    .filter(Boolean);

  return (
    <div className="room-card">
      <div className="left-column">
        <div className="image-container">
          {formattedImages.length > 0 ? (
            <div className="image-carousel">
              <img
                src={formattedImages[currentImageIndex]}
                alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                className="room-image"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=Image+Not+Available";
                }}
              />
              {formattedImages.length > 1 && (
                <>
                  <button className="carousel-button prev" onClick={prevImage}>
                    &lt;
                  </button>
                  <button className="carousel-button next" onClick={nextImage}>
                    &gt;
                  </button>
                  <div className="image-counter">
                    {currentImageIndex + 1}/{formattedImages.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="no-image-placeholder">
              <img
                src="https://via.placeholder.com/400x300?text=No+Image+Available"
                alt="No images available"
                className="room-image"
              />
            </div>
          )}
        </div>

        <div className="basic-info">
          <h2 className="room-title">{hotel.name}</h2>
          <div className="room-meta">
            <p>
              <strong>Address:</strong> {hotel.address}
            </p>
            <p>
              <strong>Guest:</strong> {booking.firstName} {booking.lastName}
            </p>
            <p>
              <strong>Email:</strong> {booking.email}
            </p>
            <p>
              <strong>Check-in:</strong> {booking.searchParams?.checkin}
            </p>
            <p>
              <strong>Check-out:</strong> {booking.searchParams?.checkout}
            </p>
            <p>
              <strong>Nights:</strong> {nights}
            </p>
            <p>
              <strong>Guests:</strong> {booking.searchParams?.guests}
            </p>
            {booking.specialRequests && (
              <p>
                <strong>Special Requests:</strong> {booking.specialRequests}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="right-column">
        <div className="amenities-section">
          <div className="amenity-group">
            <h4>Room:</h4>
            <div className="amenity-tags">
              <span className="amenity-tag">{room.roomDescription}</span>
            </div>
          </div>

          {room.amenities && room.amenities.length > 0 && (
            <div className="amenity-group">
              <h4>Amenities:</h4>
              <div className="amenity-tags">
                {room.amenities.slice(0, 5).map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="price-section">
          <div className="price-display">
            <p className="current-price">
              ${room.converted_price || room.price || "0.00"}
            </p>
            <p className="price-note">per night</p>
            <p className="total-price">Total: ${totalPrice}</p>
          </div>

          {/* <div className="booking-cta">
            {hotel.id || hotel._id || booking.hotelId || booking.hotel?.id || booking.hotel?._id ? (
              <button className="book-button" onClick={handleViewHotel}>
                View Hotel
              </button>
            ) : (
              <button className="book-button" disabled>
                Hotel Details Unavailable
              </button>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
}
