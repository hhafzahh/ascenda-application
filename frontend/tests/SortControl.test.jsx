import { render, screen, fireEvent } from "@testing-library/react";
import SortControl from "../src/components/SortControl";
import React from "react";
import "@testing-library/jest-dom";

//mock hotel objects
const mockHotels = [
  {
    id: "1",
    name: "Hotel A",
    price: 200,
    rating: 4.5,
  },
  {
    id: "2",
    name: "Hotel B",
    price: 150,
    rating: 4.0,
  },
  {
    id: "3",
    name: "Hotel C",
    price: 100,
    rating: 5.0,
  },
];

describe("SortControl Component", () => {
  test("renders sorting options", () => {
    render(<SortControl selected="rating" onSelect={() => {}} />);

    // Check if sorting options are rendered
    expect(screen.getByText("Top Rating")).toBeInTheDocument();
    expect(screen.getByText("Low to High Price")).toBeInTheDocument();
    expect(screen.getByText("High to Low Price")).toBeInTheDocument();
  });

  test("calls onSelect when a sorting option is clicked", () => {
    const handleSelect = jest.fn();

    render(<SortControl selected="rating" onSelect={handleSelect} />);

    // Simulate clicking the "Low to High Price" button
    fireEvent.click(screen.getByText("Low to High Price"));

    // Assert that the onSelect handler was called with the correct value
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("priceLowToHigh");

    // Simulate clicking the "Top Rating" button
    fireEvent.click(screen.getByText("Top Rating"));

    // Assert that the onSelect handler was called with the correct value
    expect(handleSelect).toHaveBeenCalledWith("rating");
  });
});

describe("Hotel Sorting Logic", () => {
  test("sorts hotels by rating in descending order (Top Rating)", () => {
    const sortedHotels = mockHotels.sort((a, b) => b.rating - a.rating); // Sorting by rating (desc)

    // Assert the sorting order - top rated high to low
    expect(sortedHotels[0].name).toBe("Hotel C");
    expect(sortedHotels[1].name).toBe("Hotel A");
    expect(sortedHotels[2].name).toBe("Hotel B");
  });

  test("sorts hotels by price in ascending order (Low to High Price)", () => {
    const sortedHotels = mockHotels.sort((a, b) => a.price - b.price); // Sorting by price (asc)

    // Assert the sorting order - lowtohigh
    expect(sortedHotels[0].name).toBe("Hotel C");
    expect(sortedHotels[1].name).toBe("Hotel B");
    expect(sortedHotels[2].name).toBe("Hotel A");
  });

  test("sorts hotels by price in descending order (High to Low Price)", () => {
    const sortedHotels = mockHotels.sort((a, b) => b.price - a.price); // Sorting by price (desc)

    // Assert the sorting order - hightolow
    expect(sortedHotels[0].name).toBe("Hotel A");
    expect(sortedHotels[1].name).toBe("Hotel B");
    expect(sortedHotels[2].name).toBe("Hotel C");
  });
});
