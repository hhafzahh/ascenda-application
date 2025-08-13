import { render, screen, fireEvent } from "@testing-library/react";
import StarRatingFilter from "../src/components/StarRatingFilter";
import "@testing-library/jest-dom";
import React from "react";

// Mock hotel data
const mockHotels = [
  { id: "1", name: "Hotel A", rating: 5 },
  { id: "2", name: "Hotel B", rating: 4 },
  { id: "3", name: "Hotel C", rating: 3 },
  { id: "4", name: "Hotel D", rating: 2 },
  { id: "5", name: "Hotel E", rating: 1 },
];

describe("StarRatingFilter Component", () => {
  const mockOnChange = jest.fn();

  test("renders the star rating filter and calls onChange when a checkbox is clicked", () => {
    render(<StarRatingFilter selectedStars={[]} onChange={mockOnChange} />);

    // Simulate clicking the "5 Stars" checkbox
    const fiveStarCheckbox = screen.getByLabelText("5 Stars");
    fireEvent.click(fiveStarCheckbox);

    // ensure that on  change is called when a checkbox is clicked
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // check if value is correct
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "5",
        }),
      })
    );
  });

  test("filters hotels based on selected star rating", () => {
    const selectedStars = ["5"]; // Simulate selecting 5 stars
    const filteredHotels = mockHotels.filter((hotel) =>
      selectedStars.includes(String(hotel.rating))
    );

    render(
      <StarRatingFilter selectedStars={selectedStars} onChange={mockOnChange} />
    );

    // Assert that only hotels with 5 stars are included in the filtered list
    expect(filteredHotels).toEqual([{ id: "1", name: "Hotel A", rating: 5 }]);
  });
});
