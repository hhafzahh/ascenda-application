import { useState } from "react";

export function PersonalDetails() {
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
    <div className="form-container">
      <h3>Enter your details</h3>
      <div className="form-grid">
        <select>
          <option>Mr</option>
          <option>Ms</option>
          <option>Mrs</option>
        </select>
        <input placeholder="First Name" />
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
    </div>
  );
}

export function PaymentDetails() {
  return (
    <div className="form-container">
      <h3>Enter payment details</h3>
      <form>
        <input type="text" placeholder="Card Holder Name" />
        <input type="text" placeholder="Credit Card Number" />
        <div className="inline-inputs">
          <input
            type="text"
            placeholder="Expiry Date (MM/YY)"
            className="small-input"
          />
          <input type="text" placeholder="CVV" className="small-input" />
        </div>
      </form>
    </div>
  );
}

export function Confirmation() {
  //add later
  return <h2>Confirmation Details</h2>;
}
