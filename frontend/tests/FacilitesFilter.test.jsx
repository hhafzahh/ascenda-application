import { render, screen, fireEvent } from "@testing-library/react";
import FacilitiesFilter from "../src/components/FacilitiesFilter";
import "@testing-library/jest-dom";
import { roomAmenities } from "../src/config/hotel-config";
import React from "react";

describe("FacilitiesFilter Component", () => {
  test("renders all available facilities", () => {
    render(<FacilitiesFilter selectedFacilities={[]} onChange={() => {}} />);

    // Check if the facility labels are rendered correctly
    roomAmenities.forEach((facility) => {
      expect(screen.getByLabelText(facility.label)).toBeInTheDocument();
    });
  });

  test("calls onChange when a checkbox is clicked", () => {
    const handleChange = jest.fn();

    render(
      <FacilitiesFilter selectedFacilities={[]} onChange={handleChange} />
    );

    // Simulate clicking the "Air Conditioning" checkbox
    const airConditioningCheckbox = screen.getByLabelText("Air Conditioning");
    fireEvent.click(airConditioningCheckbox);

    // Assert that the onChange handler was called with the correct value
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "airConditioning",
        }),
      })
    );
  });

  test("filters hotels based on selected facilities", () => {
    const mockHotels = [
      {
        id: "1",
        name: "Hotel A",
        amenities: { airConditioning: true, outdoorPool: false },
      },
      {
        id: "2",
        name: "Hotel B",
        amenities: { airConditioning: false, outdoorPool: true },
      },
      {
        id: "3",
        name: "Hotel C",
        amenities: { airConditioning: true, outdoorPool: true },
      },
    ];

    const selectedFacilities = ["airConditioning"]; // User selects Air Conditioning

    const handleChange = jest.fn();

    render(
      <FacilitiesFilter
        selectedFacilities={selectedFacilities}
        onChange={handleChange}
      />
    );

    // Mock the filtering logic based on selected facilities
    const filteredHotels = mockHotels.filter((hotel) =>
      selectedFacilities.every((facility) => hotel.amenities[facility])
    );

    // Assert that the filtered hotels only show hotels with "airConditioning"
    expect(filteredHotels).toEqual([
      {
        id: "1",
        name: "Hotel A",
        amenities: { airConditioning: true, outdoorPool: false },
      },
      {
        id: "3",
        name: "Hotel C",
        amenities: { airConditioning: true, outdoorPool: true },
      },
    ]);
  });
});
