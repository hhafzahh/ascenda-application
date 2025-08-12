import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Amenities from "../src/components/AmenitiesCard/Amenities";

// Mock MUI Icon so we don't load the real SVG
jest.mock("@mui/icons-material/FmdGood", () => () => (
  <span data-testid="mui-icon">[Icon]</span>
));

describe("Amenities component", () => {
  test("renders parsed amenities when valid nearbyAmenities is provided", () => {
    const sampleNearby =
      "National University of Singapore - 1.6 km / 1 mi <br /> Clementi Mall - 3.3 km / 2 mi";
    const address = "31 Rochester Drive";

    render(<Amenities nearbyAmenities={sampleNearby} address={address} />);

    // Header
    expect(screen.getByText("In the area")).toBeInTheDocument();

    // Address
    expect(screen.getByText(address)).toBeInTheDocument();

    // Parsed amenities
    expect(screen.getByText("National University of Singapore")).toBeInTheDocument();
    expect(screen.getByText("1.6 km")).toBeInTheDocument();
    expect(screen.getByText("Clementi Mall")).toBeInTheDocument();
    expect(screen.getByText("3.3 km")).toBeInTheDocument();
  });

  test("renders fallback when no nearbyAmenities provided (empty string)", () => {
    render(<Amenities nearbyAmenities="" address="31 Rochester Drive" />);

    expect(screen.getByText("No information available")).toBeInTheDocument();
  });

  test("renders fallback when nearbyAmenities is null", () => {
    render(<Amenities nearbyAmenities={null} address="31 Rochester Drive" />);

    expect(screen.getByText("No information available")).toBeInTheDocument();
  });

  test("renders fallback when nearbyAmenities is an empty array", () => {
    render(<Amenities nearbyAmenities={[]} address="31 Rochester Drive" />);

    expect(screen.getByText("No information available")).toBeInTheDocument();
  });
});
