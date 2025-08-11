import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
  useNavigate: () => mockNavigate,
}));

// Mock BookingLayout component
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

// Mock fetch
global.fetch = jest.fn();

import Confirm from "../pages/Confirm";

const mockBookingData = {
  _id: "booking123",
  title: "Mr",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@email.com",
  countryCode: "+1",
  mobile: "1234567890",
  bookingForSomeone: false,
  specialRequests: "Late check-in please",
  hotel: {
    id: "hotel123",
    name: "Test Hotel",
    address: "123 Test Street"
  },
  room: {
    roomDescription: "Deluxe King Room",
    converted_price: 150.00,
    amenities: ["WiFi", "Air Conditioning"]
  },
  searchParams: {
    checkIn: "2024-01-15",
    checkOut: "2024-01-17",
    guests: 2
  }
};

const mockBookingWithoutHotel = {
  ...mockBookingData,
  hotel: undefined,
  hotelName: "Hotel Without Nested Object",
  hotelAddress: "456 Another Street"
};

describe("Confirm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  test("displays loading state initially", () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("displays error when no booking ID provided", async () => {
    useLocation.mockReturnValue({
      state: null
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Error: No booking ID provided")).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  test("fetches and displays booking data successfully", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBookingData)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Your Booking")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/bookings/booking123");
    expect(screen.getByText("Mr John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@email.com")).toBeInTheDocument();
    expect(screen.getByText("+1 1234567890")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument(); // bookingForSomeone: false
    expect(screen.getByText("Late check-in please")).toBeInTheDocument();
  });

  test("handles API error gracefully", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to load booking details")).toBeInTheDocument();
    });
  });

  test("handles network error", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to load booking details")).toBeInTheDocument();
    });
  });

  test("navigates back when back button clicked", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBookingData)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Your Booking")).toBeInTheDocument();
    });

    const backButton = screen.getByText("← Back to Edit");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test("navigates to payment when proceed button clicked", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBookingData)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Your Booking")).toBeInTheDocument();
    });

    const proceedButton = screen.getByText("Proceed to Payment →");
    fireEvent.click(proceedButton);

    expect(mockNavigate).toHaveBeenCalledWith("/payment", {
      state: {
        booking: mockBookingData,
        hotel: mockBookingData.hotel
      }
    });
  });

  test("handles booking without nested hotel object", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBookingWithoutHotel)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Your Booking")).toBeInTheDocument();
    });

    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Hotel Without Nested Object");
  });

  test("uses hotel from navigation state as fallback", async () => {
    const hotelFromNav = {
      name: "Navigation Hotel",
      address: "Navigation Address"
    };

    useLocation.mockReturnValue({
      state: { 
        bookingId: "booking123",
        hotel: hotelFromNav
      }
    });

    const bookingWithoutHotel = { ...mockBookingData, hotel: undefined };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(bookingWithoutHotel)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Your Booking")).toBeInTheDocument();
    });

    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Navigation Hotel");
  });

  test("displays Yes for booking for someone else", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    const bookingForSomeone = { ...mockBookingData, bookingForSomeone: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(bookingForSomeone)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Yes")).toBeInTheDocument();
    });
  });

  test("hides special requests section when not provided", async () => {
    useLocation.mockReturnValue({
      state: { bookingId: "booking123" }
    });

    const bookingWithoutRequests = { ...mockBookingData, specialRequests: undefined };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(bookingWithoutRequests)
    });

    render(
      <BrowserRouter>
        <Confirm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Confirm Your Booking")).toBeInTheDocument();
    });

    expect(screen.queryByText("Special Requests:")).not.toBeInTheDocument();
  });
});