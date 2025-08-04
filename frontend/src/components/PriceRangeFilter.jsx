import React, { useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

function PriceRangeFilter() {
  const MIN = 100;
  const MAX = 12000;
  const [values, setValues] = useState([MIN, MAX]);

  const boxStyle = {
    marginTop: "20px",
    width: "250px",
    maxWidth: "320px",
    padding: "36px 32px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 1px 4px rgba(18, 22, 33, 0.12)",
    fontFamily: "Arial, sans-serif",
  };

  const valuesStyle = {
    margin: 0,
    fontWeight: 500,
    color: "#275efe",
  };

  const smallStyle = {
    fontSize: "14px",
    marginTop: "8px",
    display: "block",
    color: "#99a3ba",
  };

  const sliderWrapperStyle = {
    marginTop: "20px",
    touchAction: "none", // <- ADD THIS LINE
  };

  return (
    <div>
      <div style={boxStyle}>
        <h4>
          Price <span>Range</span>
        </h4>
        <div style={valuesStyle}>
          ${MIN} - ${MAX}
        </div>
        <small style={smallStyle}>
          Current Range: ${values[0]} - ${values[1]}
        </small>
        <div style={sliderWrapperStyle}>
          <Slider
            range
            min={MIN}
            max={MAX}
            value={values}
            onChange={setValues}
            trackStyle={[{ backgroundColor: "#275efe", height: 4 }]}
            handleStyle={[
              {
                borderColor: "#275efe",
                height: 20,
                width: 20,
                marginTop: -8,
                backgroundColor: "#fff",
              },
              {
                borderColor: "#275efe",
                height: 20,
                width: 20,
                marginTop: -8,
                backgroundColor: "#fff",
              },
            ]}
            railStyle={{ backgroundColor: "#cdd9ed", height: 4 }}
          />
        </div>
      </div>
    </div>
  );
}

export default PriceRangeFilter;
