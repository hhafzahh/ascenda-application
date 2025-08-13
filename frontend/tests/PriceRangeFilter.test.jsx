import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PriceRangeFilter from "../src/components/PriceRangeFilter"; // Adjust path if necessary
import "@testing-library/jest-dom";
import React from "react";

describe("PriceRangeFilter Component", () => {
  const mockOnChange = jest.fn();
  const initialValue = [1000, 5000]; // Set initial value of the slider

  test("renders the PriceRangeFilter with initial values", () => {
    render(<PriceRangeFilter value={initialValue} onChange={mockOnChange} />);

    // Check if the range is displayed correctly
    expect(screen.getByText("$100 - $12000")).toBeInTheDocument();
    expect(
      screen.getByText(
        `Current Range: $${initialValue[0]} - $${initialValue[1]}`
      )
    ).toBeInTheDocument();
  });
});
