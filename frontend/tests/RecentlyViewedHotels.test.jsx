import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import RecentlyViewedHotels from "../src/components/RecentlyViewedHotels";
import * as storeHelper from "../src/helper/storeRecentlyViewed";

// Mock axios
jest.mock("axios");
import axios from "axios";
const mockedAxios = axios;

// Mock RecentlyViewedHotelCard component
jest.mock("../src/components/RecentlyViewedHotelCard", () => {
  return jest.fn(({ hotel }) => (
    <div data-testid={`hotel-card-${hotel.id}`} data-hotel-name={hotel.name}>
      <h3>{hotel.name}</h3>
      <p>${hotel.converted_price || hotel.price}</p>
      <p>{hotel.address}</p>
    </div>
  ));
});

// Mock CSS import
jest.mock("../src/components/RecentlyViewedHotels.css", () => {});

const mockViewedHotels = [
  {
    id: "hotel1",
    name: "Recently Viewed Hotel 1",
    converted_price: "150.00",
    address: "123 Test Street",
    searchParams: {
      destinationId: "WD0M",
      checkin: "2024-01-15",
      checkout: "2024-01-16",
      guests: "2"
    }
  },
  {
    id: "hotel2", 
    name: "Recently Viewed Hotel 2",
    converted_price: "200.00",
    address: "456 Test Avenue",
    searchParams: {
      destinationId: "ABC1",
      checkin: "2024-01-20",
      checkout: "2024-01-22",
      guests: "1"
    }
  }
];

const mockApiResponse = [
  {
    id: "hotel1",
    name: "Recently Viewed Hotel 1 (Updated)",
    converted_price: "155.00", // Updated price from API
    address: "123 Test Street",
    images: ["image1.jpg", "image2.jpg"],
    rating: 4.5
  },
  {
    id: "hotel2",
    name: "Recently Viewed Hotel 2 (Updated)", 
    converted_price: "205.00", // Updated price from API
    address: "456 Test Avenue",
    images: ["image3.jpg", "image4.jpg"],
    rating: 4.2
  },
  {
    id: "hotel3", // Extra hotel from API not in viewed list
    name: "Extra Hotel",
    converted_price: "100.00",
    address: "789 Extra Street"
  }
];

describe("RecentlyViewedHotels Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock Date for consistent tests (formatting)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("renders nothing when no recently viewed hotels", () => {
    window.localStorage.getItem.mockReturnValue(null);
    
    const { container } = render(<RecentlyViewedHotels />);
    
    expect(container.firstChild).toBeNull();
    expect(window.localStorage.getItem).toHaveBeenCalledWith("viewedHotels");
  });

  test("loads and enriches hotel data from localStorage", async () => {
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockViewedHotels));
    mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

    render(
      <BrowserRouter>
        <RecentlyViewedHotels />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hotel-card-hotel1")).toBeInTheDocument();
      expect(screen.getByText("Recently Viewed Hotel 1 (Updated)")).toBeInTheDocument();
      expect(screen.getByText("$155.00")).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/hotelproxy/hotels"),
      expect.objectContaining({
        params: expect.objectContaining({
          destination_id: "WD0M"
        })
      })
    );
  });

  test("handles API fetch errors gracefully", async () => {
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockViewedHotels));
    mockedAxios.get.mockRejectedValue(new Error("Network error"));

    render(
      <BrowserRouter>
        <RecentlyViewedHotels />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error fetching hotel data:", expect.any(Error));
    });
  });

  test("handles invalid JSON in localStorage", () => {
    window.localStorage.getItem.mockReturnValue("invalid-json");

    const { container } = render(
      <BrowserRouter>
        <RecentlyViewedHotels />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Error parsing recently viewed hotels:", expect.any(Error));
  });

  test("handles empty array in localStorage", () => {
    window.localStorage.getItem.mockReturnValue(JSON.stringify([]));

    const { container } = render(
      <BrowserRouter>
        <RecentlyViewedHotels />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
