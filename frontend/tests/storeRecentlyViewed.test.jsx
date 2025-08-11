import "@testing-library/jest-dom";
import { storeRecentlyViewed } from "../src/helper/storeRecentlyViewed";

describe("storeRecentlyViewed Utility", () => {
  beforeEach(() => {
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
    console.warn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockHotel = {
    id: "hotel1",
    name: "Test Hotel",
    address: "123 Test Street",
    converted_price: "150.00"
  };

  const mockSearchParams = {
    destinationId: "WD0M",
    checkin: "2024-01-15",
    checkout: "2024-01-16",
    guests: "2"
  };

  test("stores hotel with search params", () => {
    window.localStorage.getItem.mockReturnValue("[]");
    
    storeRecentlyViewed(mockHotel, mockSearchParams);
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "viewedHotels",
      JSON.stringify([{ ...mockHotel, searchParams: mockSearchParams }])
    );
  });

  test("does not store hotel without ID", () => {
    const hotelWithoutId = { name: "No ID Hotel" };
    
    storeRecentlyViewed(hotelWithoutId, mockSearchParams);
    
    expect(console.warn).toHaveBeenCalledWith("No hotel.id");
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
  });

  test("does not add duplicate hotels", () => {
    const existingHotels = [{ ...mockHotel, searchParams: mockSearchParams }];
    window.localStorage.getItem.mockReturnValue(JSON.stringify(existingHotels));
    
    storeRecentlyViewed(mockHotel, mockSearchParams);
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "viewedHotels",
      JSON.stringify(existingHotels)
    );
  });

  test("adds new hotel to beginning of array", () => {
    const existingHotels = [{ id: "hotel2", name: "Existing Hotel" }];
    window.localStorage.getItem.mockReturnValue(JSON.stringify(existingHotels));
    
    storeRecentlyViewed(mockHotel, mockSearchParams);
    
    const expectedArray = [
      { ...mockHotel, searchParams: mockSearchParams },
      ...existingHotels
    ];
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "viewedHotels",
      JSON.stringify(expectedArray)
    );
  });

  test("limits array to maximum 4 hotels", () => {
    const existingHotels = [
      { id: "hotel2", name: "Hotel 2" },
      { id: "hotel3", name: "Hotel 3" },
      { id: "hotel4", name: "Hotel 4" },
      { id: "hotel5", name: "Hotel 5" }
    ];
    
    window.localStorage.getItem.mockReturnValue(JSON.stringify(existingHotels));
    
    storeRecentlyViewed(mockHotel, mockSearchParams);
    
    const savedArray = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
    expect(savedArray).toHaveLength(4);
  });

  test("handles empty localStorage", () => {
    window.localStorage.getItem.mockReturnValue(null);
    
    storeRecentlyViewed(mockHotel, mockSearchParams);
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "viewedHotels",
      JSON.stringify([{ ...mockHotel, searchParams: mockSearchParams }])
    );
  });
});
