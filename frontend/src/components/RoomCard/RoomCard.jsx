import { useState } from "react";
import "./RoomCard.css";
import { useNavigate } from "react-router-dom";

export default function RoomCard({ room, searchParams, hotelId }) {
  //Take in room as an object from Hotel API
  const {
    roomDescription,
    long_description,
    free_cancellation,
    images = [],
    converted_price,
    base_rate_in_currency,
    points,
    amenities = [],
  } = room; // Destructure the room object to get the necessary properties
  //console.log("inRoomCard.jsx", searchParams);

  const [currentImageIndex, setCurrentImageIndex] = useState(0); // State to manage the current image index (shown in the corousel)

  const navigate = useNavigate();

  const handleSelectRoom = () => {
    //console.log("Navigating with room:", room);
    //console.log("Navigating with searchParams:", searchParams);
    navigate("/booking", {
      state: {
        room,
        searchParams, // make sure this exists at this point
        hotelId,
      },
    });
  };
  // Extract bed information from the long description
  const extractBedInfo = () => {
    if (!long_description) return "—";

    // First try to find explicit bed info
    const bedMatch = long_description.match(/<strong>([^<]+)<\/strong>/); //try strong tags first
    if (bedMatch && bedMatch[1].toLowerCase().includes("bed")) {
      return bedMatch[1];
    }

    // Then try other patterns
    const patterns = [
      //try patterns that match common bed descriptions second
      /(\d+\s*(?:king|queen|single|double|twin|full)\s*beds?)/i, //with number
      /(?:king|queen|single|double|twin|full)\s*bed/i, //without number
      /bed type:\s*([^\n]+)/i, //specific bed type
      /beds?:\s*([^\n]+)/i, //general beds description
      /(\d+\s*bed)/i, //just number and bed
    ];

    for (const pattern of patterns) {
      const match = long_description.match(pattern);
      if (match) return match[1] || match[0];
    }

    return "—";
  };

  const bedInfo = extractBedInfo();

  // Fixed size extraction
  const extractRoomSize = () => {
    if (!long_description) return "—";

    // First try to find the exact pattern
    const sizeMatch = long_description.match(/(\d+)-sq-foot/);
    if (sizeMatch) {
      // Convert sq ft to m² (1 sq ft = 0.092903 m²)
      const sqft = parseInt(sizeMatch[1]);
      const sqm = (sqft * 0.092903).toFixed(1);
      return `${sqm} m² (${sqft} sq ft)`;
    }

    // Fallback to other patterns
    const sizePatterns = [
      /(\d+(?:\.\d+)?)\s*(?:sq\s*\.?\s*m|m²|square\s*meters?)/i,
      /size:\s*(\d+(?:\.\d+)?)\s*(?:sq\s*\.?\s*m|m²|square\s*meters?)/i,
    ];

    for (const pattern of sizePatterns) {
      const match = long_description.match(pattern);
      if (match) return `${match[1]} m²`;
    }

    return "—";
  };

  const roomSize = extractRoomSize();

  // Categorize amenities to important ones
  const sleepAmenities = amenities.filter(
    (a) =>
      a.toLowerCase().includes("bed") ||
      a.toLowerCase().includes("pillow") ||
      a.toLowerCase().includes("linen")
  );

  const bathroomAmenities = amenities.filter(
    (a) =>
      a.toLowerCase().includes("bath") ||
      a.toLowerCase().includes("shower") ||
      a.toLowerCase().includes("toiletries")
  );

  const otherAmenities = amenities
    .filter(
      (a) => !sleepAmenities.includes(a) && !bathroomAmenities.includes(a)
    )
    .slice(0, 4);

  // Carousel functionality
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Format price to Singapore Dollar currency
  const formatPrice = (value) => {
    return value
      ? new Intl.NumberFormat("en-SG", {
          style: "currency",
          currency: "SGD",
          minimumFractionDigits: 2,
        }).format(value)
      : "N/A";
  };

  return (
    <div className="room-card">
      {" "}
      {/* Main container for the room card */}
      {/* Left Column - Image and Basic Info */}
      <div className="left-column">
        <div className="image-container">
          {images.length > 0 ? (
            <div className="image-carousel">
              <img
                src={images[currentImageIndex]?.url}
                alt={`${roomDescription} - Image ${currentImageIndex + 1}`}
                className="room-image"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=Room+Image";
                }}
              />
              {images.length > 1 && (
                <>
                  <button className="carousel-button prev" onClick={prevImage}>
                    &lt;
                  </button>
                  <button className="carousel-button next" onClick={nextImage}>
                    &gt;
                  </button>
                  <div className="image-counter">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="no-image-placeholder">
              <img
                src="https://via.placeholder.com/400x300?text=No+Image+Available"
                alt="No room images available"
              />
            </div>
          )}
        </div>

        <div className="basic-info">
          <h2 className="room-title">{roomDescription}</h2>
          <div className="room-meta">
            <p>
              <strong>Bed:</strong> {bedInfo}
            </p>
            <p>
              <strong>Size:</strong> {roomSize}
            </p>
            <p>
              <strong>Cancellation:</strong>{" "}
              {free_cancellation ? "Free" : "Non-refundable"}
            </p>
          </div>
        </div>
      </div>
      {/* Right Column - Amenities and Price */}
      <div className="right-column">
        <div className="amenities-section">
          {sleepAmenities.length > 0 && (
            <div className="amenity-group">
              <h4>Sleep:</h4>
              <div className="amenity-tags">
                {sleepAmenities.slice(0, 3).map((amenity, index) => (
                  <span key={`sleep-${index}`} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bathroomAmenities.length > 0 && (
            <div className="amenity-group">
              <h4>Bathroom:</h4>
              <div className="amenity-tags">
                {bathroomAmenities.slice(0, 3).map((amenity, index) => (
                  <span key={`bath-${index}`} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {otherAmenities.length > 0 && (
            <div className="amenity-group">
              <h4>Other:</h4>
              <div className="amenity-tags">
                {otherAmenities.slice(0, 3).map((amenity, index) => (
                  <span key={`other-${index}`} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="price-section">
          <div className="price-display">
            <p className="current-price">{formatPrice(converted_price)}</p>
            {/*<p className="price-note">per night</p>*/}
            {points && (
              <p className="points-option">
                or {points.toLocaleString()} points
              </p>
            )}
          </div>

          <div className="booking-cta">
            <button className="book-button" onClick={handleSelectRoom}>
              Select Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
