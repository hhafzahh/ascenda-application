import React from "react";

export default function RatingSlider({
  min = 0,
  max = 5,
  step = 0.1,
  value,
  onChange,
}) {
  return (
    <></>
    // <div style={{ margin: "1rem 0" }}>
    //   <label
    //     style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
    //   >
    //     Filter by Guests Rating: {value} / 5
    //   </label>
    //   <input
    //     type="range"
    //     min={min}
    //     max={max}
    //     step={step}
    //     value={value}
    //     onChange={(e) => onChange(parseFloat(e.target.value))}
    //     style={{ width: "100%" }}
    //   />
    // </div>
  );
}
