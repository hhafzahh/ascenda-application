import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HotelOverview from "../src/components/HotelOverview/HotelOverview";

// PrimeReact comes with CSS files that Jest doesn't know how to handle
// Instead of configuring Jest for CSS (which can be tricky), we just mock these imports
// This keeps our test setup simple while still letting the component work normally
jest.mock("primereact/resources/themes/saga-blue/theme.css", () => ({}));
jest.mock("primereact/resources/primereact.min.css", () => ({}));
jest.mock("primereact/resources/themes/lara-light-blue/theme.css", () => ({}));

// We replace the star icons with simple spans that have test IDs
// This makes it easy to count how many of each type of star is rendered
// (full stars, half stars, and empty stars)
// Instead of trying to check the actual icons, we can just count these spans
jest.mock("react-icons/fa", () => ({
  FaStar: (props) => <span data-testid="star-full" {...props} />,
  FaStarHalfAlt: (props) => <span data-testid="star-half" {...props} />,
  FaRegStar: (props) => <span data-testid="star-empty" {...props} />,
}));

// We replace PrimeReact and MUI components with simpler versions
// This helps us focus on testing just the HotelOverview logic
// without worrying about how these UI libraries work internally
jest.mock("primereact/tag", () => ({
  Tag: ({ value }) => <span data-testid="category-tag">{value}</span>,
}));
jest.mock("@mui/material", () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

// The Ratings component has its own tests, so here we just need a simple version
// that shows us it received the right hotel data
jest.mock("../src/components/Rating/Ratings", () => ({
  __esModule: true,
  default: ({ hotel }) => <div data-testid="ratings">RATINGS for {hotel?.name}</div>,
}));

// For the map, we create a version that displays all its props in separate spans
// This makes it easy to check that we're passing the right coordinates, name, and price
jest.mock("../src/components/MapCard/Map", () => ({
  __esModule: true,
  default: ({ lat, lng, hotelName, price }) => (
    <div data-testid="map">
      <span data-testid="map-lat">{lat}</span>
      <span data-testid="map-lng">{lng}</span>
      <span data-testid="map-name">{hotelName}</span>
      <span data-testid="map-price">{price}</span>
    </div>
  ),
}));

// This is our test data, structured exactly like what we'd get from the API
// We're using a real hotel (Park Avenue Rochester) as an example to make our tests
// more realistic and to catch any issues with real-world data formatting
const apiHotel = {
  id: "jOZC",
  imageCount: 69,
  // These are the actual coordinates for Park Avenue Rochester
  latitude: 1.3049,
  longitude: 103.788184,
  name: "Park Avenue Rochester",
  address: "31 Rochester Drive",
  rating: 4,  // 4 out of 5 stars
  description: `Don't miss out on recreational opportunities including an outdoor pool and a fitness center. This hotel also features complimentary wireless internet access, concierge services, and a banquet hall.

Enjoy a meal at the restaurant, or stay in and take advantage of the hotel's room service. Quench your thirst with your favorite drink at the bar/lounge. Buffet breakfasts are available daily from 6:30 AM to 10:30 AM for a fee.

Featured amenities include complimentary newspapers in the lobby, dry cleaning/laundry services, and a 24-hour front desk. This hotel has 5 meeting rooms available for events. Self parking (subject to charges) is available onsite.

Make yourself at home in one of the 351 air-conditioned rooms featuring minibars and LED televisions. Complimentary wireless internet access keeps you connected, and cable programming is available for your entertainment. Private bathrooms with bathtubs feature hair dryers and slippers. Conveniences include phones, as well as safes and desks.

Distances are displayed to the nearest 0.1 mile and kilometer. <br /> <p>National University of Singapore - 1.6 km / 1 mi <br /> Clementi Mall - 3.3 km / 2 mi <br /> West Coast Park - 3.4 km / 2.1 mi <br /> Alexandra Hospital - 3.4 km / 2.1 mi <br /> Gleneagles Hospital - 4.2 km / 2.6 mi <br /> National Orchid Garden - 4.6 km / 2.9 mi <br /> Singapore Botanic Gardens - 4.8 km / 3 mi <br /> Orchard Tower - 5.7 km / 3.5 mi <br /> ION Orchard - 6.1 km / 3.8 mi <br /> Lucky Plaza - 6.2 km / 3.8 mi <br /> Mount Faber Park - 6.3 km / 3.9 mi <br /> The Paragon - 6.4 km / 3.9 mi <br /> Mount Elizabeth Medical Center - 6.7 km / 4.1 mi <br /> Orchard Road - 6.9 km / 4.3 mi <br /> Takashimaya Shopping Centre - 7 km / 4.4 mi <br /> </p><p>The nearest airports are:<br />Seletar Airport (XSP) - 20.7 km / 12.9 mi<br /> Singapore Changi Airport (SIN) - 31.2 km / 19.4 mi<br /> Senai International Airport (JHB) - 61.6 km / 38.3 mi<br /> </p><p></p>

With a stay at Park Avenue Rochester in Singapore (Queenstown), you'll be a 5-minute drive from Singapore Botanic Gardens and 8 minutes from Orchard Road.  This hotel is 5.9 mi (9.5 km) from Marina Bay Sands Skypark and 6 mi (9.6 km) from Marina Bay Sands Casino.

In Singapore (Queenstown)`,
  price: 0,
};

// These tests focus on how HotelOverview handles data exactly as it comes from our API
// We want to make sure it displays everything correctly and handles all the edge cases
describe("HotelOverview Unit Tests (API-shaped data)", () => {
  // Start fresh before each test to avoid any interference between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Check that the basic hotel information is displayed correctly
  // The hotel name should be prominent (in a heading) and we should show what type of property it is
  test("renders hotel name and 'Hotel' tag", () => {
    render(<HotelOverview hotel={apiHotel} onSelectRoom={() => {}} />);
    // Using getByRole with heading helps ensure the name has proper semantic markup
    expect(
      screen.getByRole("heading", { name: /Park Avenue Rochester/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("category-tag")).toHaveTextContent("Hotel");
  });

  // For a 4-star hotel, we should see exactly:
  // - 4 filled stars (★★★★)
  // - 1 empty star (☆)
  // This helps users quickly understand the hotel's rating
  test("renders stars for rating=4 (4 full, 0 half, 1 empty)", () => {
    render(<HotelOverview hotel={apiHotel} onSelectRoom={() => {}} />);
    expect(screen.getAllByTestId("star-full")).toHaveLength(4);
    expect(screen.queryAllByTestId("star-half")).toHaveLength(0);
    expect(screen.getAllByTestId("star-empty")).toHaveLength(1);
  });

  // The hotel description has several parts that need to be shown in different places:
  // 1. The main description about the hotel's features
  // 2. A section about nearby attractions
  // 3. The hotel's address
  test("main description is rendered, and nearby distances are shown in Amenities", () => {
    render(<HotelOverview hotel={apiHotel} onSelectRoom={() => {}} />);
    
    // Check that the main description appears (we use the first paragraph as a marker)
    // Note: This uses dangerouslySetInnerHTML internally, but that's okay since we trust our API
    expect(
      screen.getByText(/Don't miss out on recreational opportunities/i)
    ).toBeInTheDocument();

    // The "In the area" section should show nearby attractions
    // Here we check both the section header and a specific nearby place
    expect(screen.getByText(/In the area/i)).toBeInTheDocument();
    expect(screen.getByText(/National University of Singapore/i)).toBeInTheDocument();

    // The hotel's address should be prominently displayed in the Amenities section
    expect(screen.getByText(/31 Rochester Drive/i)).toBeInTheDocument();
  });

  // The map needs several pieces of information to work correctly:
  // - Latitude and longitude for the marker position
  // - Hotel name for the popup
  // This test makes sure we pass all of that correctly
  test("passes coordinates and meta to Map", () => {
    render(<HotelOverview hotel={apiHotel} onSelectRoom={() => {}} />);
    // Check each piece of map data individually so it's clear what might be wrong
    expect(screen.getByTestId("map-lat")).toHaveTextContent(String(apiHotel.latitude));
    expect(screen.getByTestId("map-lng")).toHaveTextContent(String(apiHotel.longitude));
    expect(screen.getByTestId("map-name")).toHaveTextContent(apiHotel.name);
  });

  // The "Select Room" button is a key interaction point
  // This test ensures it works correctly by checking that:
  // 1. The button is clickable
  // 2. Clicking it calls the right function
  test("clicking Select Room triggers callback", () => {
    // Create a spy function to stand in for the click handler
    const onSelectRoom = jest.fn();
    render(<HotelOverview hotel={apiHotel} onSelectRoom={onSelectRoom} />);
    
    // Find and click the button (using role helps ensure it's accessible)
    fireEvent.click(screen.getByRole("button", { name: /Select Room/i }));
    
    // Verify our handler was called exactly once
    expect(onSelectRoom).toHaveBeenCalledTimes(1);
  });

  // Sometimes we might not have a rating for a hotel
  // Instead of breaking or showing partial stars, we should:
  // 1. Show all empty stars (☆☆☆☆☆)
  // 2. Still keep the 5-star scale visible
  test("falls back to 0-star rendering when rating is missing", () => {
    // Create a version of our test hotel without a rating
    const noRating = { ...apiHotel, rating: undefined };
    render(<HotelOverview hotel={noRating} onSelectRoom={() => {}} />);
    
    // Verify we see exactly 5 empty stars (no full or half stars)
    expect(screen.queryAllByTestId("star-full")).toHaveLength(0);
    expect(screen.queryAllByTestId("star-half")).toHaveLength(0);
    expect(screen.getAllByTestId("star-empty")).toHaveLength(5);
  });
});
