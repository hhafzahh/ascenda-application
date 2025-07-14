import { useState } from "react";
import "../css/BookingForm.css";
import Progress from "./Progress";
import { Confirmation, PaymentDetails, PersonalDetails } from "./Form";
export default function BookingForm() {
  //const message = ["Input Personal Details", "Input Payment Details", "Confirmation Details"];

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
        return <PersonalDetails />;
      case 2:
        return <PaymentDetails />;
      case 3:
        return <Confirmation />;
      default:
        return null;
    }
  };

  return (
    <div className="form-card">
      <h2>Booking Form</h2>
      <div className="progress_container">
        <Progress totalSteps={totalSteps} step={step} />
        <div className={`${step >= 1 ? "circle active" : "circle"}`}>1</div>
        <div className={`${step >= 2 ? "circle active" : "circle"}`}>2</div>
        <div className={`${step >= 3 ? "circle active" : "circle"}`}>3</div>
      </div>

      <div className="content">
        {/* <Message step={step} /> */}
        {renderSteps()}
      </div>
      <div className="btns">
        <button
          className={`${step <= 1 ? "disabled" : "btn"}`}
          onClick={handlePrev}
        >
          Prev
        </button>
        <button
          className={`${step >= totalSteps ? "disabled" : "btn"}`}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );

  // function Message({ step }) { //TESTING
  //   return <h2>{message[step - 1]}</h2>;
  // }
}
