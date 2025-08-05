// In your components/HotelDetails.jsx
import { useEffect, useState } from "react";
import "../css/HotelSelected.css";

function HotelDetails({ room, searchParams, hotel }) { // Add hotel prop here
  if (!room) return null;
  if (!searchParams) return null;

  // Debug logs to see what we're receiving
  console.log("HotelDetails component - room:", room);
  console.log("HotelDetails component - hotel:", hotel);
  console.log("Hotel name:", hotel?.name);
  console.log("Hotel address:", hotel?.address);

  const {
    images = [],
    roomDescription,
    converted_price,
    base_rate_in_currency,
  } = room;

  const { checkin, checkout } = searchParams;
  const imageUrl = images[0]?.url || "https://via.placeholder.com/400x300?text=Hotel+Image";

  return (
    <div className="summary-card">
      <img src={imageUrl} alt="Hotel" className="summary-image" />
      
      {/* Use hotel data from props */}
      <h4>{hotel?.name || "Hotel Name Not Available"}</h4>
      <div>
        <p>{hotel?.address || "Address Not Available"}</p>
        <br></br>
        <p className="description">{roomDescription}</p>
      </div>

      <div className="summary-info">
        <div>
          <p className="label">Check In</p>
          <p className="border-box">{checkin}</p>
        </div>
        <div>
          <p className="label">Check Out</p>
          <p className="border-box">{checkout}</p>
        </div>
      </div>

      <div className="price-section">
        <p className="price">
          {new Intl.NumberFormat("en-SG", {
            style: "currency",
            currency: "SGD",
          }).format(converted_price || base_rate_in_currency)}
        </p>
      </div>
    </div>
  );
}

export default HotelDetails;