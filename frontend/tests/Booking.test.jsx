import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
}));

// Mock components
jest.mock("components/BookingLayout", () => {
  return function MockBookingLayout({ children, room, searchParams, hotel }) {
    return (
      <div data-testid="booking-layout">
        <div data-testid="layout-room">{room?.roomDescription}</div>
        <div data-testid="layout-hotel">{hotel?.name}</div>
        <div data-testid="layout-search-params">{searchParams?.checkIn}</div>
        {children}
      </div>
    );
  };
});

jest.mock("components/BookingForm", () => {
  return function MockBookingForm({ room, searchParams, hotel }) {
    return (
      <div data-testid="booking-form">
        <div data-testid="form-room">{room?.roomDescription}</div>
        <div data-testid="form-hotel">{hotel?.name}</div>
        <div data-testid="form-search-params">{searchParams?.checkIn}</div>
      </div>
    );
  };
});

// Import the actual component after mocking dependencies
import Booking from "../pages/Booking";

const mockLocationState = {
  room: {
    roomDescription: "Deluxe King Room",
    converted_price: 150.00,
    amenities: ["WiFi", "Air Conditioning"]
  },
  searchParams: {
    checkIn: "2024-01-15",
    checkOut: "2024-01-17",
    guests: 2
  },
  hotel: {
    id: "hotel123",
    name: "Test Hotel",
    address: "123 Test Street"
  }
};

describe("Booking Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders booking page with room data", () => {
    useLocation.mockReturnValue({
      state: mockLocationState
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByTestId("booking-layout")).toBeInTheDocument();
    expect(screen.getByTestId("booking-form")).toBeInTheDocument();
    expect(screen.getByText("Deluxe King Room")).toBeInTheDocument();
    expect(screen.getByText("Test Hotel")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });

  test("passes correct props to BookingLayout", () => {
    useLocation.mockReturnValue({
      state: mockLocationState
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByTestId("layout-room")).toHaveTextContent("Deluxe King Room");
    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Test Hotel");
    expect(screen.getByTestId("layout-search-params")).toHaveTextContent("2024-01-15");
  });

  test("passes correct props to BookingForm", () => {
    useLocation.mockReturnValue({
      state: mockLocationState
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByTestId("form-room")).toHaveTextContent("Deluxe King Room");
    expect(screen.getByTestId("form-hotel")).toHaveTextContent("Test Hotel");
    expect(screen.getByTestId("form-search-params")).toHaveTextContent("2024-01-15");
  });

  test("displays error when no room data provided", () => {
    useLocation.mockReturnValue({
      state: null
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByText("Error: No room data provided.")).toBeInTheDocument();
    expect(screen.queryByTestId("booking-layout")).not.toBeInTheDocument();
  });

  test("displays error when room is undefined", () => {
    useLocation.mockReturnValue({
      state: {
        searchParams: mockLocationState.searchParams,
        hotel: mockLocationState.hotel
      }
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByText("Error: No room data provided.")).toBeInTheDocument();
  });

  test("handles missing search params gracefully", () => {
    useLocation.mockReturnValue({
      state: {
        room: mockLocationState.room,
        hotel: mockLocationState.hotel
      }
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByTestId("booking-layout")).toBeInTheDocument();
    expect(screen.getByTestId("form-room")).toHaveTextContent("Deluxe King Room");
  });

  test("handles missing hotel data gracefully", () => {
    useLocation.mockReturnValue({
      state: {
        room: mockLocationState.room,
        searchParams: mockLocationState.searchParams
      }
    });

    render(
      <BrowserRouter>
        <Booking />
      </BrowserRouter>
    );

    expect(screen.getByTestId("booking-layout")).toBeInTheDocument();
    expect(screen.getByTestId("form-room")).toHaveTextContent("Deluxe King Room");
    expect(screen.getByTestId("form-search-params")).toHaveTextContent("2024-01-15");
  });
});