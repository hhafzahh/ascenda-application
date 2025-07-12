import { useState } from "react";
import "../css/BookingForm.css";
export default function BookingForm() {
  const [isBookingForSomeone, setIsBookingForSomeone] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    guestName: "",
    guestPhone: "",
  });

  const handleCheckboxChange = () => {
    setIsBookingForSomeone(!isBookingForSomeone);
  };

  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <div className="form-card">
      <h2>Booking Form</h2>

      <h3>Your Details</h3>
      <p className="desc-text">
        Whether you are in town for business or leisure, San Francisco Marriott
        welcomes travelers to Northern California with exceptional service.
      </p>

      <div className="form-grid">
        <select>
          <option>Mr</option>
          <option>Ms</option>
          <option>Mrs</option>
        </select>
        <input placeholder="Fast Name" />
        <input placeholder="Last Name" />
      </div>

      <input placeholder="Email" className="full-width" />

      <div className="form-grid">
        <select>
          <option>+65 (Singapore)</option>
          <option>+60 (Malaysia)</option>
          <option>+62 (Indonesia)</option>
        </select>
        <input placeholder="Mobile" />
      </div>

      <div className="guest-section">
        <label>
          <input
            type="checkbox"
            checked={isBookingForSomeone}
            onChange={handleCheckboxChange}
          />{" "}
          Booking for someone?
        </label>

        {isBookingForSomeone && (
          <div className="guest-fields">
            <input
              type="text"
              name="guestName"
              value={guestInfo.guestName}
              onChange={handleGuestChange}
              placeholder="Guest full name"
            />
            <input
              type="text"
              name="guestPhone"
              value={guestInfo.guestPhone}
              onChange={handleGuestChange}
              placeholder="Guest phone number"
            />
          </div>
        )}
      </div>
      <button className="next-step-btn" onClick={() => alert("Next step!")}>
        NEXT STEP
      </button>
    </div>
  );
}
