// tests/SearchResultsPagination.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import SearchResults from "../src/pages/SearchResults";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]), // /destinations.json mock
  })
);

//  Map/Leaflet mocks
jest.mock("leaflet", () => ({
  Map: jest.fn(),
  TileLayer: jest.fn(),
  Marker: jest.fn(),
  Icon: jest.fn().mockImplementation(() => ({
    iconUrl: "test-icon-url",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })),
  divIcon: jest.fn().mockImplementation(() => ({
    html: "<div>test</div>",
    className: "test-class",
  })),
}));

jest.mock("react-leaflet", () => ({
  MapContainer: jest.fn(({ children, ...props }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  )),
  TileLayer: jest.fn(() => <div data-testid="tile-layer" />),
  Marker: jest.fn(({ children, position, icon }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      data-icon={icon ? "custom-icon" : "default-icon"}
    >
      {children}
    </div>
  )),
  Popup: jest.fn(({ children }) => <div data-testid="popup">{children}</div>),
}));

// mock hotelcard
jest.mock("../src/components/HotelCard", () => (props) => (
  <div data-testid="hotel-card-proxy-id">
    <h3>{props.hotel.name}</h3>
    <p>{props.hotel.price}</p>
  </div>
));

// for pagination
const buildHotels = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `h-${i + 1}`,
    name: `Hotel ${i + 1}`,
    price: 50 + i, // distinct prices
    rating: (i % 5) + 1, // 1..5, cycles; default sort is by rating desc
    amenities: { wifi: true },
  }));

const baseState = {
  searchQuery: "Test Search",
  destinationId: "D1",
  checkin: "2025-12-01",
  checkout: "2025-12-05",
  guests: 2,
};

function renderWithRouter(stateHotels) {
  const state = { ...baseState, hotels: stateHotels };
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/results", state }]}>
      <Routes>
        <Route path="/results" element={<SearchResults />} />
      </Routes>
    </MemoryRouter>
  );
}

//pagination
describe("SearchResults pagination", () => {
  test("shows 10 items per page, navigates through pages, honors sorting by rating (default)", async () => {
    const hotels = buildHotels(23); // expect 3 pages (10, 10, 3)
    renderWithRouter(hotels);

    // Page 1 indicator and count
    expect(await screen.findByText(/Page 1 of 3/i)).toBeInTheDocument();
    let cards = await screen.findAllByTestId("hotel-card-proxy-id");
    expect(cards).toHaveLength(10);

    //
    const sortedByRatingDesc = [...hotels].sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    );
    const expectedPage1 = sortedByRatingDesc.slice(0, 10).map((h) => h.name);
    const expectedPage2 = sortedByRatingDesc.slice(10, 20).map((h) => h.name);
    const expectedPage3 = sortedByRatingDesc.slice(20).map((h) => h.name);

    // assert all expected names for page 1 are present
    expectedPage1.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole("button", { name: /previous/i });
    const nextBtn = screen.getByRole("button", { name: /next/i });

    // Prev disabled on first page; Next enabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Go to page 2
    await userEvent.click(nextBtn);
    expect(await screen.findByText(/Page 2 of 3/i)).toBeInTheDocument();
    cards = await screen.findAllByTestId("hotel-card-proxy-id");
    expect(cards).toHaveLength(10);
    expectedPage2.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();

    // Go to page 3
    await userEvent.click(nextBtn);
    expect(await screen.findByText(/Page 3 of 3/i)).toBeInTheDocument();
    cards = await screen.findAllByTestId("hotel-card-proxy-id");
    expect(cards).toHaveLength(3);
    expectedPage3.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeDisabled();

    // Back to page 2 to confirm going backwards works
    await userEvent.click(prevBtn);
    expect(await screen.findByText(/Page 2 of 3/i)).toBeInTheDocument();
    cards = await screen.findAllByTestId("hotel-card-proxy-id");
    expect(cards).toHaveLength(10);
  });

  test("hides pagination controls when results fit on one page", async () => {
    const hotels = buildHotels(4);
    renderWithRouter(hotels);

    const cards = await screen.findAllByTestId("hotel-card-proxy-id");
    expect(cards).toHaveLength(4);

    expect(screen.queryByText(/Page \d+ of \d+/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /previous/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next/i })
    ).not.toBeInTheDocument();
  });
});
