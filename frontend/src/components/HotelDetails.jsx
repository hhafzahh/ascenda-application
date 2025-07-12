import "../css/HotelSelected.css";
//this is for hotelSelected for booking
function HotelDetails() {
  //hardcoded for now for UI purposes
  return (
    <div className="summary-card">
      <img
        src="https://d2ey9sqrvkqdfs.cloudfront.net/1TOY/0.jpg"
        alt="Hotel"
        className="summary-image"
      />
      <h4>San Francisco Marriott Marquis ..</h4>
      <p>780 Mission Street, San Francisco</p>

      <div className="summary-info">
        <div>
          <p className="label">Check In</p>
          <p>22 Aug, 2024, Tuesday</p>
        </div>
        <div>
          <p className="label">Check Out</p>
          <p>22 Aug, 2024, Tuesday</p>
        </div>
      </div>

      <div className="price-section">
        <p className="discount">20% OFF</p>
        <p className="price">399 USD</p>
      </div>

      <button className="pay-now">PAY NOW</button>
    </div>
  );
}

export default HotelDetails;
