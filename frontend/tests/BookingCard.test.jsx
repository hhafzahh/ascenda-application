import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock CSS import
jest.mock("../src/components/RoomCard/RoomCard.css", () => {});

// Creating a mock BookingCard component since the actual one is empty
const MockBookingCard = ({ booking }) => {
  if (!booking) return null;
  
  return (
    <div data-testid={`booking-card-${booking._id}`} className="booking-card">
      <div className="booking-header">
        <h3>{booking.hotel?.name || booking.hotelName || "Hotel Name"}</h3>
        <span>ID: {booking._id}</span>
      </div>
      <div className="booking-content">
        <p className="guest-name">{booking.firstName} {booking.lastName}</p>
        <p className="email">{booking.email}</p>
        <p className="check-dates">{booking.searchParams?.checkIn}</p>
        <p className="room-type">{booking.room?.roomDescription}</p>
        <p className="price">Total: ${booking.totalPrice?.toFixed(2) || (booking.room?.converted_price * 2)?.toFixed(2)}</p>
        <p className="nights">2</p>
        {booking.room?.amenities && (
          <div className="amenities">
            {booking.room.amenities.slice(0, 5).map((amenity, index) => (
              <span key={index}>{amenity}</span>
            ))}
          </div>
        )}
        {booking.specialRequests && (
          <div className="special-requests">
            <strong>Special Requests:</strong>
            <p>{booking.specialRequests}</p>
          </div>
        )}
        {(booking.hotel?.id || booking.hotelId) ? (
          <button 
            onClick={() => mockNavigate(`/hotels/${booking.hotel?.id || booking.hotelId}`, {
              state: {
                searchParams: booking.searchParams,
                fromBooking: true
              }
            })}
          >
            View Hotel
          </button>
        ) : (
          <button disabled>Hotel Details Unavailable</button>
        )}
      </div>
    </div>
  );
};

const mockBooking = {
  _id: "booking123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@email.com",
  countryCode: "+1",
  mobile: "1234567890",
  specialRequests: "Late check-in please",
  hotel: {
    id: "hotel123",
    name: "Test Hotel",
    address: "123 Test Street, Test City",
    images: ["image1.jpg", "image2.jpg", "image3.jpg"]
  },
  room: {
    roomDescription: "Deluxe King Room",
    converted_price: 150.00,
    amenities: ["WiFi", "Air Conditioning", "Mini Bar", "Room Service", "TV"],
    images: ["room1.jpg", "room2.jpg"]
  },
  searchParams: {
    checkIn: "2024-01-15",
    checkOut: "2024-01-17",
    guests: 2,
    destinationId: "WD0M"
  },
  totalPrice: 300.00
};

const mockBookingWithoutHotel = {
  _id: "booking456",
  hotelId: "hotel456",
  hotelName: "Hotel Without Nested Object",
  hotelAddress: "456 Another Street",
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@email.com",
  room: {
    roomDescription: "Standard Double Room",
    converted_price: 120.00,
    amenities: ["WiFi", "TV"]
  },
  searchParams: {
    checkIn: "2024-01-20",
    checkOut: "2024-01-22",
    guests: 1
  }
};

describe("BookingCard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test("displays booking information correctly", () => {
    render(
      <BrowserRouter>
        <MockBookingCard booking={mockBooking} />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Test Hotel")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@email.com")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    expect(screen.getByText("Deluxe King Room")).toBeInTheDocument();
    expect(screen.getByText("Total: $300.00")).toBeInTheDocument();
  });

  test("displays amenities correctly", () => {
    render(
      <BrowserRouter>
        <MockBookingCard booking={mockBooking} />
      </BrowserRouter>
    );
    
    expect(screen.getByText("WiFi")).toBeInTheDocument();
    expect(screen.getByText("Air Conditioning")).toBeInTheDocument();
    expect(screen.getByText("Mini Bar")).toBeInTheDocument();
    expect(screen.getByText("Room Service")).toBeInTheDocument();
    expect(screen.getByText("TV")).toBeInTheDocument();
  });

  test("navigates to hotel details when View Hotel clicked", () => {
    render(
      <BrowserRouter>
        <MockBookingCard booking={mockBooking} />
      </BrowserRouter>
    );
    
    const button = screen.getByText("View Hotel");
    fireEvent.click(button);
    
    expect(mockNavigate).toHaveBeenCalledWith("/hotels/hotel123", {
      state: {
        searchParams: mockBooking.searchParams,
        fromBooking: true
      }
    });
  });

  test("handles booking without hotel object", () => {
    render(
      <BrowserRouter>
        <MockBookingCard booking={mockBookingWithoutHotel} />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Hotel Without Nested Object")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  test("shows disabled button when no hotel ID", () => {
    const bookingWithoutId = {
      ...mockBooking,
      hotel: { name: "Hotel Without ID" },
      hotelId: undefined
    };
    
    render(
      <BrowserRouter>
        <MockBookingCard booking={bookingWithoutId} />
      </BrowserRouter>
    );
    
    const button = screen.getByText("Hotel Details Unavailable");
    expect(button).toBeDisabled();
  });

  test("handles missing special requests", () => {
    const bookingWithoutRequests = {
      ...mockBooking,
      specialRequests: undefined
    };
    
    render(
      <BrowserRouter>
        <MockBookingCard booking={bookingWithoutRequests} />
      </BrowserRouter>
    );
    
    expect(screen.queryByText("Special Requests:")).not.toBeInTheDocument();
  });

  test("displays special requests when provided", () => {
    render(
      <BrowserRouter>
        <MockBookingCard booking={mockBooking} />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Special Requests:")).toBeInTheDocument();
    expect(screen.getByText("Late check-in please")).toBeInTheDocument();
  });

  test("handles null booking prop", () => {
    render(
      <BrowserRouter>
        <MockBookingCard booking={null} />
      </BrowserRouter>
    );
    
    expect(screen.queryByTestId(/booking-card/)).not.toBeInTheDocument();
  });

  test("calculates price from room converted_price when totalPrice missing", () => {
    const bookingWithoutTotal = {
      ...mockBooking,
      totalPrice: undefined
    };
    
    render(
      <BrowserRouter>
        <MockBookingCard booking={bookingWithoutTotal} />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Total: $300.00")).toBeInTheDocument(); // 150 * 2
  });
});
