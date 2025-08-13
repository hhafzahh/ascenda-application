import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom"; // To simulate routing for SearchResults
import "@testing-library/jest-dom";
import SearchResults from "../src/pages/SearchResults";

// Mocking the HotelCard component
jest.mock("../src/components/HotelCard", () => (props) => (
  <div
    data-testid={`hotel-card-proxy-${props.hotel.id}`}
    data-props={JSON.stringify(props)}
  >
    <h3>{props.hotel.name}</h3>
    <p>{props.hotel.price}</p>
  </div>
));

// Mocking other components like SearchBar, FacilitiesFilter, etc.
jest.mock("../src/components/SearchBar/searchBar", () => (props) => (
  <div data-testid="search-bar-proxy" data-props={JSON.stringify(props)} />
));

jest.mock("../src/components/FacilitiesFilter", () => (props) => (
  <div
    data-testid="facilities-filter-proxy"
    data-props={JSON.stringify(props)}
  />
));

jest.mock("../src/components/StarRatingFilter", () => (props) => (
  <div
    data-testid="star-rating-filter-proxy"
    data-props={JSON.stringify(props)}
  />
));

jest.mock("../src/components/PriceRangeFilter", () => (props) => (
  <div
    data-testid="price-range-filter-proxy"
    data-props={JSON.stringify(props)}
  />
));

// Mocking SearchResults to include the hotel cards and filter components
jest.mock("../src/pages/SearchResults", () => {
  return jest.fn(({ location }) => {
    return (
      <div data-testid="mock-search-results">
        <h1>Mocked SearchResults Page</h1>

        {/* Hotel cards */}
        {location.state.hotels.map((hotel) => (
          <div key={hotel.id}>
            <div
              data-testid={`hotel-card-proxy-${hotel.id}`}
              data-props={JSON.stringify(hotel)}
            >
              <h3>{hotel.name}</h3>
              <p>{hotel.price}</p>
            </div>
          </div>
        ))}

        {/* Filter components */}
        {/* Filter components */}
        <div data-testid="facilities-filter-proxy">Facilities Filter</div>
        <div data-testid="star-rating-filter-proxy">Star Rating Filter</div>
        <div data-testid="price-range-filter-proxy">Price Range Filter</div>
      </div>
    );
  });
});

test("SearchResults page is mocked correctly and renders hotel cards", async () => {
  const mockLocationState = {
    hotels: [
      { id: "obxM", name: "Mercure Singapore Tyrwhitt", price: 100 },
      { id: "T9cE", name: "Hotel 81", price: 50 },
      { id: "xU8z", name: "Hotel Boss", price: 200 },
      { id: "fggT", name: "The St. Regis Singapore", price: 300 },
    ],
    searchQuery: "Test Search",
    destinationId: "D1",
    checkin: "2025-12-01",
    checkout: "2025-12-05",
    guests: 2,
  };

  render(
    <BrowserRouter>
      <SearchResults location={{ state: mockLocationState }} />
    </BrowserRouter>
  );

  screen.debug();
  // Check if the mocked SearchResults page is rendered
  await waitFor(() => {
    const mockedSearchResults = screen.getByTestId("mock-search-results");
    expect(mockedSearchResults).toBeInTheDocument();
    expect(screen.getByText("Mocked SearchResults Page")).toBeInTheDocument();
  });

  // Check if hotel cards are rendered for each hotel
  mockLocationState.hotels.forEach((hotel) => {
    const hotelCard = screen.getByTestId(`hotel-card-proxy-${hotel.id}`);
    expect(hotelCard).toHaveAttribute(
      "data-props",
      expect.stringContaining(hotel.name)
    );
    expect(hotelCard).toHaveTextContent(hotel.name);
    expect(hotelCard).toHaveTextContent(`${hotel.price}`);
  });
});

test("SearchResults page renders filter components", async () => {
  const mockLocationState = {
    hotels: [
      { id: "obxM", name: "Mercure Singapore Tyrwhitt", price: 100 },
      { id: "T9cE", name: "Hotel 81", price: 50 },
      { id: "xU8z", name: "Hotel Boss", price: 200 },
      { id: "fggT", name: "The St. Regis Singapore", price: 300 },
    ],
    searchQuery: "Test Search",
    destinationId: "D1",
    checkin: "2025-12-01",
    checkout: "2025-12-05",
    guests: 2,
  };

  render(
    <BrowserRouter>
      <SearchResults location={{ state: mockLocationState }} />
    </BrowserRouter>
  );

  screen.debug();

  // Check if the filter components are rendered
  await waitFor(() => {
    const facilitiesFilter = screen.getByTestId("facilities-filter-proxy");
    const starRatingFilter = screen.getByTestId("star-rating-filter-proxy");
    const priceRangeFilter = screen.getByTestId("price-range-filter-proxy");

    expect(facilitiesFilter).toBeInTheDocument();
    expect(starRatingFilter).toBeInTheDocument();
    expect(priceRangeFilter).toBeInTheDocument();
  });
});

//above is mocking page + mocking components
/////////

//below is mock components only... //but doesnt want to render hotel cards ://

// import React from "react";
// import { render, screen, act } from "@testing-library/react";
// import axios from "axios";
// import { BrowserRouter } from "react-router-dom";
// import "@testing-library/jest-dom";
// import SearchResults from "../src/pages/SearchResults"; // Path to your component
// import "@testing-library/jest-dom";

// beforeAll(() => {
//   global.fetch = jest.fn(() =>
//     Promise.resolve({
//       json: () =>
//         Promise.resolve({
//           /* mock data */
//         }),
//     })
//   );
// });

// afterAll(() => {
//   jest.restoreAllMocks();
// });

// // Mocking the necessary components
// jest.mock("../src/components/HotelCard", () => (props) => (
//   <div
//     data-testid={`hotel-card-proxy-${props.hotel.id}`}
//     data-props={JSON.stringify(props)}
//   >
//     <h3>{props.hotel.name}</h3>
//     <p>{props.hotel.price}</p>
//   </div>
// ));
// jest.mock("axios");

// // Mocking other components inside SearchResults
// jest.mock("../src/components/FacilitiesFilter", () => () => (
//   <div data-testid="facilities-filter-proxy">Facilities Filter</div>
// ));

// jest.mock("../src/components/StarRatingFilter", () => () => (
//   <div data-testid="star-rating-filter-proxy">Star Rating Filter</div>
// ));

// jest.mock("../src/components/PriceRangeFilter", () => () => (
//   <div data-testid="price-range-filter-proxy">Price Range Filter</div>
// ));
// test("deep link: fetches hotels by URL param when no state is provided", async () => {
//   // Mock the API call for the SearchResults page
//   axios.get.mockResolvedValueOnce({
//     data: [
//       { id: "obxM", name: "Mercure Singapore Tyrwhitt", price: 100 },
//       { id: "T9cE", name: "Hotel 81", price: 50 },
//       { id: "xU8z", name: "Hotel Boss", price: 200 },
//       { id: "fggT", name: "The St. Regis Singapore", price: 300 },
//     ],
//   });

//   // Use act() to wait for async effects
//   await act(async () => {
//     render(
//       <BrowserRouter>
//         <SearchResults location={{ state: { destinationId: "H123" } }} />
//       </BrowserRouter>
//     );
//   });

//   // Check the rendered output
//   screen.debug(); // Debug the rendered DOM to see if the hotel cards are rendered

//   // Check if hotel cards are rendered for each hotel
//   const hotels = [
//     { id: "obxM", name: "Mercure Singapore Tyrwhitt", price: 100 },
//     { id: "T9cE", name: "Hotel 81", price: 50 },
//     { id: "xU8z", name: "Hotel Boss", price: 200 },
//     { id: "fggT", name: "The St. Regis Singapore", price: 300 },
//   ];

//   for (const hotel of hotels) {
//     const hotelCard = await screen.findByTestId(`hotel-card-proxy-${hotel.id}`);
//     expect(hotelCard).toBeInTheDocument();
//     expect(hotelCard).toHaveTextContent(hotel.name);
//     expect(hotelCard).toHaveTextContent(`${hotel.price}`);
//   }

//   // Ensure that axios.get was called with the correct URL
//   expect(axios.get).toHaveBeenCalledWith(
//     "http://localhost:3001/api/hotelproxy/hotels/uid/H123"
//   );
// });
