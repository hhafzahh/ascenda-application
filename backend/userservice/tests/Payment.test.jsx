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

// Mock Stripe
jest.mock("@stripe/stripe-js", () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(),
    confirmCardPayment: jest.fn()
  }))
}));

jest.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>
}));

// Mock components
jest.mock("../components/CheckoutForm", () => {
  return function MockCheckoutForm({ booking }) {
    return (
      <div data-testid="checkout-form">
        <div data-testid="checkout-booking-name">{booking.firstName} {booking.lastName}</div>
        <div data-testid="checkout-booking-email">{booking.email}</div>
        <div data-testid="checkout-room-price">${booking.room?.converted_price}</div>
      </div>
    );
  };
});

jest.mock("../components/BookingLayout", () => {
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

import Payment from "../pages/Payment";

const mockBooking = {
  _id: "booking123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@email.com",
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

const mockBookingWithoutHotel = {
  ...mockBooking,
  hotel: undefined,
  hotelName: "Hotel Without Nested Object",
  hotelAddress: "456 Another Street"
};

describe("Payment Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders payment page with booking data", () => {
    useLocation.mockReturnValue({
      state: { booking: mockBooking }
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByTestId("booking-layout")).toBeInTheDocument();
    expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    expect(screen.getByTestId("checkout-form")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@email.com")).toBeInTheDocument();
    expect(screen.getByText("$150")).toBeInTheDocument();
  });

  test("displays error when no booking data provided", () => {
    useLocation.mockReturnValue({
      state: null
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByText("Error: No booking data provided.")).toBeInTheDocument();
    expect(screen.queryByTestId("booking-layout")).not.toBeInTheDocument();
  });

  test("displays error when booking is undefined", () => {
    useLocation.mockReturnValue({
      state: {}
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByText("Error: No booking data provided.")).toBeInTheDocument();
  });

  test("passes correct props to BookingLayout with hotel data", () => {
    useLocation.mockReturnValue({
      state: { booking: mockBooking }
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByTestId("layout-room")).toHaveTextContent("Deluxe King Room");
    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Test Hotel");
    expect(screen.getByTestId("layout-search-params")).toHaveTextContent("2024-01-15");
  });

  test("handles booking without nested hotel object", () => {
    useLocation.mockReturnValue({
      state: { booking: mockBookingWithoutHotel }
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByTestId("booking-layout")).toBeInTheDocument();
    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Hotel Without Nested Object");
  });

  test("uses hotel from navigation state as fallback", () => {
    const hotelFromNav = {
      name: "Navigation Hotel",
      address: "Navigation Address"
    };

    useLocation.mockReturnValue({
      state: { 
        booking: { ...mockBooking, hotel: undefined },
        hotel: hotelFromNav
      }
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Navigation Hotel");
  });

  test("falls back to default hotel data when no hotel info available", () => {
    const bookingWithoutHotelInfo = {
      ...mockBooking,
      hotel: undefined,
      hotelName: undefined,
      hotelAddress: undefined
    };

    useLocation.mockReturnValue({
      state: { booking: bookingWithoutHotelInfo }
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByTestId("layout-hotel")).toHaveTextContent("Selected Hotel");
  });

  test("passes booking data to CheckoutForm", () => {
    useLocation.mockReturnValue({
      state: { booking: mockBooking }
    });

    render(
      <BrowserRouter>
        <Payment />
      </BrowserRouter>
    );

    expect(screen.getByTestId("checkout-booking-name")).toHaveTextContent("John Doe");
    expect(screen.getByTestId("checkout-booking-email")).toHaveTextContent("john.doe@email.com");
    expect(screen.getByTestId("checkout-room-price")).toHaveTextContent("$150");
  });
});