// tests/PriceRangeFilter.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PriceRangeFilter from "../src/components/PriceRangeFilter";

//mock rc-slider (keeps the current min and only updates the max when input changes)
jest.mock("rc-slider", () => {
  const React = require("react");
  return function MockSlider({
    value,
    min = 100,
    max = 5000,
    onChange,
    "data-testid": dataTestId,
  }) {
    return (
      <input
        type="range"
        min={min}
        max={max}
        value={value[1]}
        data-testid={dataTestId || "mock-slider"}
        onChange={(e) => {
          const newMax = Number(e.target.value);
          const newRange = [value[0], newMax];
          onChange && onChange(newRange);
        }}
      />
    );
  };
});

describe("PriceRangeFilter Component", () => {
  const initialValue = [1000, 5000];
  const mockOnChange = jest.fn();

  test("renders with initial values", () => {
    render(<PriceRangeFilter value={initialValue} onChange={mockOnChange} />);

    // Static min/max label
    expect(screen.getByText("$100 - $5000")).toBeInTheDocument();

    // Current range text reflects the prop value
    expect(
      screen.getByText(
        `Current Range: $${initialValue[0]} - ${`$${initialValue[1]}`}`
      )
    ).toBeInTheDocument();
  });
});

//filters mock hotels by price
function PriceFilterHotels() {
  const [range, setRange] = React.useState([1000, 5000]); // default to [1000, 5000]

  const hotels = React.useMemo(
    () => [
      { id: "h1", name: "Budget Inn", price: 200 },
      { id: "h2", name: "Comfort Stay", price: 800 },
      { id: "h3", name: "City Hotel", price: 1200 },
      { id: "h4", name: "Grand Plaza", price: 3000 },
      { id: "h5", name: "Royal Suites", price: 4500 },
    ],
    []
  );

  const visible = hotels.filter(
    (h) => h.price >= range[0] && h.price <= range[1]
  );

  return (
    <div>
      <PriceRangeFilter value={range} onChange={setRange} />
      <ul data-testid="hotel-list">
        {visible.map((h) => (
          <li key={h.id}>{`${h.name} - $${h.price}`}</li>
        ))}
      </ul>
    </div>
  );
}

describe("PriceRangeFilter integration with mock hotels", () => {
  test("filters hotels when the slider (mock) max value changes", () => {
    render(<PriceFilterHotels />);

    // Initial range is [1000, 5000] → expect 1200, 3000, 4500 visible
    expect(screen.queryByText(/Budget Inn - \$200/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Comfort Stay - \$800/)).not.toBeInTheDocument();
    expect(screen.getByText(/City Hotel - \$1200/)).toBeInTheDocument();
    expect(screen.getByText(/Grand Plaza - \$3000/)).toBeInTheDocument();
    expect(screen.getByText(/Royal Suites - \$4500/)).toBeInTheDocument();

    // Move the mocked slider's max down to 2500 → new range [1000, 2500]
    const slider = screen.getByTestId("mock-slider");
    fireEvent.change(slider, { target: { value: "2500" } });

    // Now only 1200 remains visible (others are out of range)
    expect(screen.queryByText(/Budget Inn - \$200/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Comfort Stay - \$800/)).not.toBeInTheDocument();
    expect(screen.getByText(/City Hotel - \$1200/)).toBeInTheDocument();
    expect(screen.queryByText(/Grand Plaza - \$3000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Royal Suites - \$4500/)).not.toBeInTheDocument();
  });

  test("checks the exact values as inclusive boundary testing", () => {
    render(<PriceFilterHotels />);

    const slider = screen.getByTestId("mock-slider");

    // Set max to exactly 3000 (should include the 3000-price hotel)
    fireEvent.change(slider, { target: { value: "3000" } });

    expect(screen.queryByText(/City Hotel - \$1200/)).toBeInTheDocument();
    expect(screen.getByText(/Grand Plaza - \$3000/)).toBeInTheDocument();
    expect(screen.queryByText(/Royal Suites - \$4500/)).not.toBeInTheDocument();
  });
});
