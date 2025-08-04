import { useEffect, useState } from "react";
import "../css/HotelSelected.css";
//this is for hotelSelected for booking
function HotelDetails({ room, searchParams, hotelId }) {
  if (!room) return null;
  if (!searchParams) return null;
  const [hotel, setHotel] = useState(null);

  useEffect(() => {
    if (!hotelId) return;

    console.log(hotelId);
    console.log(searchParams.destinationId);

    fetch(`http://localhost:3001/api/hotelproxy/hotels/details/${hotelId}`)
      .then((res) => res.json())
      .then((data) => {
        setHotel(data);
      })
      .catch((err) => {
        console.error("Failed to fetch hotel details:", err);
      });
  }, [hotelId]);

  console.log(hotel);

  const {
    images = [],
    roomDescription,
    converted_price,
    long_description,
    base_rate_in_currency,
  } = room;
  //hardcoded for now for UI purposes

  const { destinationId, checkin, checkout, guests } = searchParams;
  const imageUrl =
    images[0]?.url || "https://via.placeholder.com/400x300?text=Hotel+Image";

  return (
    <div className="summary-card">
      <img src={imageUrl} alt="Hotel" className="summary-image" />
      <h4>New Majestic Hotel</h4>
      <p>{roomDescription}</p>
      <br></br>
      <p>31-37 Bukit Pasoh Road</p>

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