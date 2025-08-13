import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HotelRooms from "../src/pages/HotelRooms";
import axios from "axios";
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

const mockHotelId = "H123";
const mockSearchParams = {
  destinationId: "D1",
  checkin: "2025-10-01",
  checkout: "2025-10-05",
  guests: "2",
};

describe("HotelRooms Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rendering pagination", async () => {
    const mockRooms = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      roomDescription: `room ${i+1}`,
      long_description: `<strong>Roomie</strong>`,
      free_cancellation: true,
      images: [{ url: "https://example.com/img.jpg" }],
      converted_price: 100,
      base_rate_in_currency: 100,
      points: 500,
      amenities: ["WiFi"],
    }));

    axios.get.mockResolvedValueOnce({ data: [{ id: mockHotelId }] }); // hotel meta
    axios.get.mockResolvedValueOnce({ data: { rooms: mockRooms } }); // rooms

    render(
    <MemoryRouter>
      <HotelRooms
        hotelId={mockHotelId}
        searchParams={mockSearchParams}
        hotelDetails={{}}
      />
    </MemoryRouter>
    );

    // First page load
    await waitFor(() => expect(screen.getByText(/Room 1/i)).toBeInTheDocument());
    expect(screen.getAllByText(/Room /i)).toHaveLength(4);

    // Navigate to next page
    fireEvent.click(screen.getByText(/Next/i));
    
    await waitFor(() => expect(screen.getByText(/Room 5/i)).toBeInTheDocument());
    expect(screen.getAllByText(/Room /i)).toHaveLength(1);

    // Navigate back
    fireEvent.click(screen.getByText(/Previous/i));
    await waitFor(() => expect(screen.getByText(/Room 1/i)).toBeInTheDocument());
  });
});
