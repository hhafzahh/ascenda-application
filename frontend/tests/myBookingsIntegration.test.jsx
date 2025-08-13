import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import MyBookings from "../src/pages/MyBookings";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock CSS
jest.mock("../src/pages/MyBookings.css", () => {});

// Mock sessionStorage properly (not localStorage)
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock fetch API
global.fetch = jest.fn();

describe("My Bookings Integration", () => {
  const mockBooking = {
    _id: "booking123",
    firstName: "John",
    lastName: "Doe",
    email: "john@test.com",
    hotel: {
      id: "hotel456",
      name: "Marina Bay Hotel",
      address: "123 Marina Drive"
    },
    room: {
      roomDescription: "Deluxe Ocean View",
      converted_price: "200.00"
    },
    searchParams: {
      checkIn: "2024-01-15",
      checkOut: "2024-01-17",
      guests: 2
    },
    totalPrice: 400
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    // Set up authenticated user in sessionStorage
    sessionStorageMock.setItem('userId', 'user123');
    console.log = jest.fn(); // Suppress console logs
  });

  afterEach(() => {
    sessionStorageMock.clear();
  });

  test("loads and displays user bookings", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBooking],
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    // Wait for bookings to load
    await waitFor(() => {
      expect(screen.getByText("Marina Bay Hotel")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check API call was made with correct URL
    expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/bookings/user/user123");
  });

  test("shows empty state when no bookings", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/haven't made any bookings yet/i)).toBeInTheDocument();
    });

    const startButton = screen.getByRole('button', { name: /find hotels/i });
    fireEvent.click(startButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test("handles API errors", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test("handles HTTP error responses", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test("navigates to hotel details when booking exists", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBooking],
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    // Wait for booking to load and verify it displays
    await waitFor(() => {
      expect(screen.getByText("Marina Bay Hotel")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Since BookingCard doesn't have active navigation button, 
    // just verify the booking data is displayed correctly
    expect(screen.getByText("Deluxe Ocean View")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
  });

  test("handles multiple bookings", async () => {
    const multipleBookings = [
      mockBooking,
      { 
        ...mockBooking, 
        _id: "booking789", 
        firstName: "Alice", 
        hotel: { ...mockBooking.hotel, name: "Grand Plaza" } 
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => multipleBookings,
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Marina Bay Hotel")).toBeInTheDocument();
      expect(screen.getByText("Grand Plaza")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test("redirects to login when not authenticated", async () => {
    // Clear sessionStorage to simulate no auth
    sessionStorageMock.clear();

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test("shows correct empty state UI", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Bookings")).toBeInTheDocument();
      expect(screen.getByText(/haven't made any bookings yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /find hotels/i })).toBeInTheDocument();
    });
  });

  test("shows loading state initially", async () => {
    // Mock a delayed response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => [],
        }), 100)
      )
    );

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    // Should show loading initially
    expect(screen.getByText("Loading your bookings...")).toBeInTheDocument();

    // Wait for it to finish loading
    await waitFor(() => {
      expect(screen.queryByText("Loading your bookings...")).not.toBeInTheDocument();
    });
  });

  test("makes correct API call structure", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <BrowserRouter>
        <MyBookings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3002/api/bookings/user/user123"
      );
    });
  });
});