import { useEffect, useState } from "react";

export function PersonalDetails({ setIsStepValid }) {
  const [isBookingForSomeone, setIsBookingForSomeone] = useState(false);

  const [guestInfo, setGuestInfo] = useState({
    guestName: "",
    guestPhone: "",
  });

  const [personalInfo, setPersonalInfo] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    countryCode: "+65",
  });

  useEffect(() => {
    const valid = isPersonalValid();
    setIsStepValid(valid);
  }, [personalInfo, guestInfo, isBookingForSomeone]);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const isPersonalValid = () => {
    const { title, firstName, lastName, email, mobile } = personalInfo;
    if (!title || !firstName || !lastName || !email || !mobile) return false;

    if (isBookingForSomeone) {
      return guestInfo.guestName && guestInfo.guestPhone;
    }

    return true;
  };

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
        <select
          name="title"
          value={personalInfo.title}
          onChange={handlePersonalChange}
        >
          <option value="">Title</option>
          <option value="Mr">Mr</option>
          <option value="Ms">Ms</option>
          <option value="Mrs">Mrs</option>
        </select>

        <input
          name="firstName"
          value={personalInfo.firstName}
          onChange={handlePersonalChange}
          placeholder="First Name"
        />

        <input
          name="lastName"
          value={personalInfo.lastName}
          onChange={handlePersonalChange}
          placeholder="Last Name"
        />
      </div>

      <input
        name="email"
        value={personalInfo.email}
        onChange={handlePersonalChange}
        placeholder="Email"
        className="full-width"
      />

      <div className="form-grid">
        <select
          name="countryCode"
          value={personalInfo.countryCode}
          onChange={handlePersonalChange}
        >
          <option>+65 (Singapore)</option>
          <option>+60 (Malaysia)</option>
          <option>+62 (Indonesia)</option>
        </select>
        <input
          name="mobile"
          value={personalInfo.mobile}
          onChange={handlePersonalChange}
          placeholder="Mobile"
        />
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
