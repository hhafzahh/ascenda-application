import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock CSS import
jest.mock("../components/BookingLayout/BookingLayout.css", () => {});

// Mock HotelDetails component
jest.mock("../src/components/HotelDetails", () => {
  return function MockHotelDetails({ room, searchParams, hotel }) {
    return (
      <div data-testid="hotel-details">
        <div data-testid="hotel-details-room">{room?.roomDescription}</div>
        <div data-testid="hotel-details-hotel">{hotel?.name}</div>
        <div data-testid="hotel-details-search">{searchParams?.checkIn}</div>
        <div data-testid="hotel-details-guests">{searchParams?.guests}</div>
      </div>
    );
  };
});

import BookingLayout from "../src/components/BookingLayout";

const mockRoom = {
  roomDescription: "Deluxe King Room",
  converted_price: 150.00,
  amenities: ["WiFi", "Air Conditioning", "Mini Bar"]
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
  images: ["image1.jpg", "image2.jpg"]
};

describe("BookingLayout Component", () => {
  test("renders layout structure correctly", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  test("passes correct props to HotelDetails component", () => {
    const TestChild = () => <div>Test Content</div>;

    render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("hotel-details-room")).toHaveTextContent("Deluxe King Room");
    expect(screen.getByTestId("hotel-details-hotel")).toHaveTextContent("Test Hotel");
    expect(screen.getByTestId("hotel-details-search")).toHaveTextContent("2024-01-15");
    expect(screen.getByTestId("hotel-details-guests")).toHaveTextContent("2");
  });

  test("renders with multiple children", () => {
    render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel}>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
        <div data-testid="child-3">Third Child</div>
      </BookingLayout>
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
    expect(screen.getByTestId("child-3")).toBeInTheDocument();
    expect(screen.getByText("First Child")).toBeInTheDocument();
    expect(screen.getByText("Second Child")).toBeInTheDocument();
    expect(screen.getByText("Third Child")).toBeInTheDocument();
  });

  test("handles missing room data gracefully", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={null} searchParams={mockSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details-room")).toBeEmptyDOMElement();
  });

  test("handles missing search params gracefully", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={mockRoom} searchParams={null} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details-search")).toBeEmptyDOMElement();
    expect(screen.getByTestId("hotel-details-guests")).toBeEmptyDOMElement();
  });

  test("handles missing hotel data gracefully", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={null}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details-hotel")).toBeEmptyDOMElement();
  });

  test("handles all props being null", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={null} searchParams={null} hotel={null}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details-room")).toBeEmptyDOMElement();
    expect(screen.getByTestId("hotel-details-hotel")).toBeEmptyDOMElement();
    expect(screen.getByTestId("hotel-details-search")).toBeEmptyDOMElement();
    expect(screen.getByTestId("hotel-details-guests")).toBeEmptyDOMElement();
  });

  test("renders without children", () => {
    render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel}>
      </BookingLayout>
    );

    expect(screen.getByTestId("hotel-details")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-details-room")).toHaveTextContent("Deluxe King Room");
  });

  test("maintains proper layout structure with booking-layout-container class", () => {
    const TestChild = () => <div>Test Content</div>;

    const { container } = render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(container.querySelector('.booking-layout-container')).toBeInTheDocument();
    expect(container.querySelector('.booking-layout')).toBeInTheDocument();
    expect(container.querySelector('.booking-left')).toBeInTheDocument();
    expect(container.querySelector('.booking-right')).toBeInTheDocument();
  });

  test("places children in left section and HotelDetails in right section", () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    const { container } = render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    const leftSection = container.querySelector('.booking-left');
    const rightSection = container.querySelector('.booking-right');

    expect(leftSection).toContainElement(screen.getByTestId("test-child"));
    expect(rightSection).toContainElement(screen.getByTestId("hotel-details"));
  });

  test("handles partial room data", () => {
    const partialRoom = {
      roomDescription: "Basic Room",
      // missing converted_price and amenities
    };

    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={partialRoom} searchParams={mockSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("hotel-details-room")).toHaveTextContent("Basic Room");
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  test("handles partial search params", () => {
    const partialSearchParams = {
      checkIn: "2024-01-15",
      // missing checkOut, guests, destinationId
    };

    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={mockRoom} searchParams={partialSearchParams} hotel={mockHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("hotel-details-search")).toHaveTextContent("2024-01-15");
    expect(screen.getByTestId("hotel-details-guests")).toBeEmptyDOMElement();
  });

  test("handles partial hotel data", () => {
    const partialHotel = {
      name: "Partial Hotel",
      // missing id, address, images
    };

    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <BookingLayout room={mockRoom} searchParams={mockSearchParams} hotel={partialHotel}>
        <TestChild />
      </BookingLayout>
    );

    expect(screen.getByTestId("hotel-details-hotel")).toHaveTextContent("Partial Hotel");
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });
});