import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import HotelRooms from "../src/pages/HotelRooms";
import axios from "axios";
import "@testing-library/jest-dom"

jest.mock("axios");

// Mock RoomCard
jest.mock("../src/components/RoomCard/RoomCard", () => ({ room }) => (
  <div data-testid="roomCard">{room.roomDescription}</div>
));

const mockHotelId = "H123";
const mockSearchParams = {
  destinationId: "D1",
  checkin: "2025-10-01",
  checkout: "2025-10-05",
  guests: "2",
};

describe("HotelRooms Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading state initially", async () => {
    axios.get.mockResolvedValueOnce({ data: [] }); // hotel meta
    axios.get.mockResolvedValueOnce({ data: { rooms: [] } }); // rooms

    render(
      <HotelRooms
        hotelId={mockHotelId}
        searchParams={mockSearchParams}
        hotelDetails={{}}
      />
    );
    expect(screen.getByText(/Loading rooms/i)).toBeInTheDocument();
  });

  test("renders error message when room API fails", async () => {
    axios.get.mockResolvedValueOnce({ data: [] }); // hotel meta
    axios.get.mockRejectedValueOnce(new Error("API failure")); // rooms

    render(
      <HotelRooms
        hotelId={mockHotelId}
        searchParams={mockSearchParams}
        hotelDetails={{}}
      />
    );

    await waitFor(() =>
      expect(screen.getByText(/Failed to fetch rooms/i)).toBeInTheDocument()
    );
  });

  test("renders 'No rooms available' when API returns empty", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { rooms: [] } });

    render(
      <HotelRooms
        hotelId={mockHotelId}
        searchParams={mockSearchParams}
        hotelDetails={{}}
      />
    );

    await waitFor(() =>
      expect(screen.getByText(/No rooms available/i)).toBeInTheDocument()
    );
  });

  test("renders RoomCard components when rooms are returned", async () => {
    const roomsMock = [
      { id: "1", roomDescription: "Room 1" },
      { id: "2", roomDescription: "Room 2" },
    ];
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.get.mockResolvedValueOnce({ data: { rooms: roomsMock } });

    render(
      <HotelRooms
        hotelId={mockHotelId}
        searchParams={mockSearchParams}
        hotelDetails={{}}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("roomCard")).toHaveLength(2);
    });
  });
});
