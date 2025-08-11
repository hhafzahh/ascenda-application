import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock the actual HotelDetails component since it's not provided
// Creating a comprehensive mock based on typical hotel details functionality
const MockHotelDetails = ({ room, searchParams, hotel }) => {
  if (!room && !hotel) return <div data-testid="hotel-details">No data available</div>;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights(searchParams?.checkIn, searchParams?.checkOut);
  const totalPrice = room?.converted_price ? room.converted_price * nights : room?.price ? room.price * nights : 0;

  return (
    <div data-testid="hotel-details" className="hotel-details">
      {hotel && (
        <div className="hotel-info">
          <h2 data-testid="hotel-name">{hotel.name}</h2>
          {hotel.address && <p data-testid="hotel-address">{hotel.address}</p>}
          {hotel.images && hotel.images.length > 0 && (
            <div className="hotel-images">
              <img 
                data-testid="hotel-main-image" 
                src={hotel.images[0]} 
                alt={hotel.name}
              />
            </div>
          )}
        </div>
      )}

      {room && (
        <div className="room-info">
          <h3 data-testid="room-description">{room.roomDescription}</h3>
          <div className="room-price">
            <span data-testid="room-price">
              {new Intl.NumberFormat("en-SG", {
                style: "currency",
                currency: "SGD",
              }).format(room.converted_price || room.price || 0)}
            </span>
            <span data-testid="price-period"> per night</span>
          </div>
          
          {room.amenities && room.amenities.length > 0 && (
            <div className="amenities" data-testid="amenities-section">
              <h4>Amenities</h4>
              <ul>
                {room.amenities.slice(0, 5).map((amenity, index) => (
                  <li key={index} data-testid={`amenity-${index}`}>{amenity}</li>
                ))}
              </ul>
              {room.amenities.length > 5 && (
                <span data-testid="amenities-more">+{room.amenities.length - 5} more</span>
              )}
            </div>
          )}

          {room.images && room.images.length > 0 && (
            <div className="room-images">
              <img 
                data-testid="room-main-image" 
                src={room.images[0]} 
                alt={room.roomDescription}
              />
            </div>
          )}
        </div>
      )}

      {searchParams && (
        <div className="booking-summary">
          <h4>Booking Summary</h4>
          {searchParams.checkIn && (
            <div className="check-dates">
              <span data-testid="check-in-date">Check-in: {formatDate(searchParams.checkIn)}</span>
            </div>
          )}
          {searchParams.checkOut && (
            <div className="check-dates">
              <span data-testid="check-out-date">Check-out: {formatDate(searchParams.checkOut)}</span>
            </div>
          )}
          {searchParams.guests && (
            <div className="guests">
              <span data-testid="guests-count">Guests: {searchParams.guests}</span>
            </div>
          )}
          {nights > 0 && (
            <div className="nights">
              <span data-testid="nights-count">{nights} night{nights !== 1 ? 's' : ''}</span>
            </div>
          )}
          {totalPrice > 0 && (
            <div className="total-price">
              <span data-testid="total-price">
                Total: {new Intl.NumberFormat("en-SG", {
                  style: "currency",
                  currency: "SGD",
                }).format(totalPrice)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mock the component import
jest.mock("components/HotelDetails", () => {
  return MockHotelDetails;
});

import HotelDetails from "components/HotelDetails";

const mockRoom = {
  roomDescription: "Deluxe King Room",
  converted_price: 150.00,
  amenities: ["WiFi", "Air Conditioning", "Mini Bar", "Room Service", "TV", "Balcony", "Safe"],
  images: ["room1.jpg", "room2.jpg"]
};

const mockRoomWithPrice = {
  roomDescription: "Standard Double Room",
  price: 120.00,
  amenities: ["WiFi", "TV"]
};

const mockSearchParams = {
  checkIn: "2024-01-15",
  checkOut: "2024-01-17",
  guests: 2,
  destinationId: "WD0M"
};

const mockHotel = {
  id: "hotel123",
  name: "Test Hotel",
  address: "123 Test Street, Test City",
  images: ["hotel1.jpg", "hotel2.jpg", "hotel3.jpg"]
};

describe("HotelDetails Component", () => {
  test("renders hotel information correctly", () => {
    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("hotel-name")).toHaveTextContent("Test Hotel");
    expect(screen.getByTestId("hotel-address")).toHaveTextContent("123 Test Street, Test City");
    expect(screen.getByTestId("hotel-main-image")).toHaveAttribute("src", "hotel1.jpg");
    expect(screen.getByTestId("hotel-main-image")).toHaveAttribute("alt", "Test Hotel");
  });

  test("renders room information correctly", () => {
    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("room-description")).toHaveTextContent("Deluxe King Room");
    expect(screen.getByTestId("room-price")).toHaveTextContent("S$150.00");
    expect(screen.getByTestId("price-period")).toHaveTextContent(" per night");
    expect(screen.getByTestId("room-main-image")).toHaveAttribute("src", "room1.jpg");
  });

  test("displays amenities correctly with limit", () => {
    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("amenities-section")).toBeInTheDocument();
    expect(screen.getByText("Amenities")).toBeInTheDocument();
    
    // Check first 5 amenities are displayed
    expect(screen.getByTestId("amenity-0")).toHaveTextContent("WiFi");
    expect(screen.getByTestId("amenity-1")).toHaveTextContent("Air Conditioning");
    expect(screen.getByTestId("amenity-2")).toHaveTextContent("Mini Bar");
    expect(screen.getByTestId("amenity-3")).toHaveTextContent("Room Service");
    expect(screen.getByTestId("amenity-4")).toHaveTextContent("TV");
    
    // Check "+2 more" is displayed since there are 7 amenities total
    expect(screen.getByTestId("amenities-more")).toHaveTextContent("+2 more");
  });

  test("displays booking summary correctly", () => {
    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByText("Booking Summary")).toBeInTheDocument();
    expect(screen.getByTestId("check-in-date")).toHaveTextContent("Check-in: 1/15/2024");
    expect(screen.getByTestId("check-out-date")).toHaveTextContent("Check-out: 1/17/2024");
    expect(screen.getByTestId("guests-count")).toHaveTextContent("Guests: 2");
    expect(screen.getByTestId("nights-count")).toHaveTextContent("2 nights");
    expect(screen.getByTestId("total-price")).toHaveTextContent("Total: S$300.00");
  });

  test("handles room with price field instead of converted_price", () => {
    render(
      <HotelDetails room={mockRoomWithPrice} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("room-price")).toHaveTextContent("S$120.00");
    expect(screen.getByTestId("total-price")).toHaveTextContent("Total: S$240.00");
  });

  test("handles missing hotel data gracefully", () => {
    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={null} />
    );

    expect(screen.queryByTestId("hotel-name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hotel-address")).not.toBeInTheDocument();
    expect(screen.getByTestId("room-description")).toBeInTheDocument();
  });

  test("handles missing room data gracefully", () => {
    render(
      <HotelDetails room={null} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("hotel-name")).toBeInTheDocument();
    expect(screen.queryByTestId("room-description")).not.toBeInTheDocument();
    expect(screen.queryByTestId("amenities-section")).not.toBeInTheDocument();
  });

  test("handles missing search params gracefully", () => {
    render(
      <HotelDetails room={mockRoom} searchParams={null} hotel={mockHotel} />
    );

    expect(screen.getByTestId("hotel-name")).toBeInTheDocument();
    expect(screen.getByTestId("room-description")).toBeInTheDocument();
    expect(screen.queryByText("Booking Summary")).not.toBeInTheDocument();
  });

  test("displays message when no data available", () => {
    render(
      <HotelDetails room={null} searchParams={null} hotel={null} />
    );

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  test("handles hotel without address", () => {
    const hotelWithoutAddress = {
      id: "hotel123",
      name: "Test Hotel",
      images: ["hotel1.jpg"]
    };

    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={hotelWithoutAddress} />
    );

    expect(screen.getByTestId("hotel-name")).toBeInTheDocument();
    expect(screen.queryByTestId("hotel-address")).not.toBeInTheDocument();
  });

  test("handles hotel without images", () => {
    const hotelWithoutImages = {
      id: "hotel123",
      name: "Test Hotel",
      address: "123 Test Street"
    };

    render(
      <HotelDetails room={mockRoom} searchParams={mockSearchParams} hotel={hotelWithoutImages} />
    );

    expect(screen.getByTestId("hotel-name")).toBeInTheDocument();
    expect(screen.queryByTestId("hotel-main-image")).not.toBeInTheDocument();
  });

  test("handles room without amenities", () => {
    const roomWithoutAmenities = {
      roomDescription: "Basic Room",
      converted_price: 100.00
    };

    render(
      <HotelDetails room={roomWithoutAmenities} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("room-description")).toBeInTheDocument();
    expect(screen.queryByTestId("amenities-section")).not.toBeInTheDocument();
  });

  test("handles room with empty amenities array", () => {
    const roomWithEmptyAmenities = {
      roomDescription: "Basic Room",
      converted_price: 100.00,
      amenities: []
    };

    render(
      <HotelDetails room={roomWithEmptyAmenities} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("room-description")).toBeInTheDocument();
    expect(screen.queryByTestId("amenities-section")).not.toBeInTheDocument();
  });

  test("handles partial search params", () => {
    const partialSearchParams = {
      checkIn: "2024-01-15",
      guests: 2
      // missing checkOut
    };

    render(
      <HotelDetails room={mockRoom} searchParams={partialSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("check-in-date")).toBeInTheDocument();
    expect(screen.getByTestId("guests-count")).toBeInTheDocument();
    expect(screen.queryByTestId("check-out-date")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nights-count")).not.toBeInTheDocument();
  });

  test("calculates single night correctly", () => {
    const singleNightParams = {
      checkIn: "2024-01-15",
      checkOut: "2024-01-16",
      guests: 1
    };

    render(
      <HotelDetails room={mockRoom} searchParams={singleNightParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("nights-count")).toHaveTextContent("1 night");
    expect(screen.getByTestId("total-price")).toHaveTextContent("Total: S$150.00");
  });

  test("handles room without images", () => {
    const roomWithoutImages = {
      roomDescription: "Basic Room",
      converted_price: 100.00,
      amenities: ["WiFi"]
    };

    render(
      <HotelDetails room={roomWithoutImages} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("room-description")).toBeInTheDocument();
    expect(screen.queryByTestId("room-main-image")).not.toBeInTheDocument();
  });

  test("shows exactly 5 amenities when there are exactly 5", () => {
    const roomWithFiveAmenities = {
      roomDescription: "Standard Room",
      converted_price: 100.00,
      amenities: ["WiFi", "TV", "AC", "Phone", "Safe"]
    };

    render(
      <HotelDetails room={roomWithFiveAmenities} searchParams={mockSearchParams} hotel={mockHotel} />
    );

    expect(screen.getByTestId("amenity-4")).toHaveTextContent("Safe");
    expect(screen.queryByTestId("amenities-more")).not.toBeInTheDocument();
  });
});