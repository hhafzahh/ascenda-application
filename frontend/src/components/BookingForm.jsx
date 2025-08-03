import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BookingForm() {
  //const message = ["Input Personal Details", "Input Payment Details", "Confirmation Details"];
  const [isStepValid, setIsStepValid] = useState(false);

  const [step, setSteps] = useState(1);
  const totalSteps = 3; //use as props for Progress
  function handlePrev() {
    if (step > 1) setSteps((step) => step - 1);
  }

  function handleNext() {
    if (step < 3) setSteps((step) => step + 1);
  }

  const renderSteps = () => {
    switch (step) {
      case 1:
        return <PersonalDetails setIsStepValid={setIsStepValid} />;

      case 2:
        return <PaymentDetails />;
      case 3:
        return <Confirmation />;
      default:
        return null;
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>Enter your details</h2>
      <div className="form-grid">
        <select value={title} onChange={(e) => setTitle(e.target.value)}>
          <option>Mr</option>
          <option>Ms</option>
          <option>Mrs</option>
        </select>
        <input
          required
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <input
        required
        className="full-width"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        required
        className="full-width"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="form-grid">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
        >
          Prev
        </select>
        <button
          className={`${
            step >= totalSteps || (step === 1 && !isStepValid)
              ? "disabled"
              : "btn"
          }`}
          onClick={handleNext}
          disabled={step === 1 && !isStepValid}
        >
          Next
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={bookingForSomeone}
          onChange={(e) => setBookingForSomeone(e.target.checked)}
        />
        Booking for someone?
      </label>
      <button type="submit" className="next-step-btn">Next</button>
    </form>
  );
}