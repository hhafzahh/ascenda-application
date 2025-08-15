import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import SearchResults from "../src/pages/SearchResults";

// --- Global fetch mock (e.g., for any destinations fetches) ---
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);

//------------------
////mock components
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

jest.mock("../src/components/HotelCard", () => (props) => (
  <div data-testid="hotel-card-proxy-id">
    <h3>{props.hotel.name}</h3>
    <p>{props.hotel.price}</p>
  </div>
));

jest.mock("../src/components/SearchBar/searchBar", () => () => (
  <div data-testid="search-bar-mock" />
));
jest.mock("../src/components/RatingSlider", () => () => (
  <div data-testid="rating-slider" />
));
jest.mock("../src/components/MapPreview", () => () => (
  <div data-testid="map-preview" />
));
jest.mock("../src/components/FullMapModal", () => () => (
  <div data-testid="full-map-modal" />
));

// Lightweight filters so we can toggle stars & facilities in tests
jest.mock("../src/components/FacilitiesFilter", () => (props) => (
  <div data-testid="facilities-filter">
    <label>
      <input
        type="checkbox"
        value="wifi"
        checked={props.selectedFacilities?.includes?.("wifi") || false}
        onChange={props.onChange}
      />
      WiFi
    </label>
    <label>
      <input
        type="checkbox"
        value="pool"
        checked={props.selectedFacilities?.includes?.("pool") || false}
        onChange={props.onChange}
      />
      Pool
    </label>
  </div>
));

jest.mock("../src/components/StarRatingFilter", () => (props) => (
  <div data-testid="star-filter">
    {[1, 2, 3, 4, 5].map((n) => (
      <label key={n}>
        <input
          type="checkbox"
          value={String(n)}
          checked={props.selectedStars?.includes?.(String(n)) || false}
          onChange={props.onChange}
        />
        {n} Star
      </label>
    ))}
  </div>
));

// SortControl is present but not directly used in these tests; keep it inert
jest.mock("../src/components/SortControl", () => (props) => (
  <div data-testid="sort-control">Sort: {props.selected}</div>
));

// --- Mock rc-slider used inside PriceRangeFilter so we can drive onChange easily ---
// Uses fireEvent.change in tests (no userEvent.clear/type on range inputs)
jest.mock("rc-slider", () => {
  const React = require("react");
  // Simple single-handle that controls MAX value while keeping current MIN.
  return function MockSlider({ value, min = 100, max = 5000, onChange }) {
    const currentMax = Math.min(max, value?.[1] ?? max);
    const currentMin = value?.[0] ?? min;
    return (
      <input
        type="range"
        min={min}
        max={max}
        value={currentMax}
        data-testid="price-slider"
        onChange={(e) => {
          const newMax = Number(e.target.value);
          onChange?.([currentMin, newMax]);
        }}
      />
    );
  };
});

//------------------

const buildHotels = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `h-${i + 1}`,
    name: `Hotel ${i + 1}`,
    price: 50 + i, // distinct prices
    rating: (i % 5) + 1, // 1..5 cycles; default sort = rating desc
    amenities: { wifi: true },
  }));

const buildMixedHotels = () => [
  {
    id: "h1",
    name: "Budget Inn",
    price: 200,
    rating: 2,
    amenities: { wifi: false, pool: false },
  },
  {
    id: "h2",
    name: "Comfort Stay",
    price: 800,
    rating: 3,
    amenities: { wifi: true, pool: false },
  },
  {
    id: "h3",
    name: "City Hotel",
    price: 1200,
    rating: 4,
    amenities: { wifi: true, pool: true },
  },
  {
    id: "h4",
    name: "Grand Plaza",
    price: 3000,
    rating: 5,
    amenities: { wifi: true, pool: true },
  },
  {
    id: "h5",
    name: "Royal Suites",
    price: 4500,
    rating: 5,
    amenities: { wifi: false, pool: true },
  },
];

const buildElevenHotels = () =>
  Array.from({ length: 11 }, (_, i) => ({
    id: `p-${i + 1}`,
    name: `Hotel P${i + 1}`,
    price: 100 + i * 50, // 100,150,...,600
    rating: 5 - (i % 5),
    amenities: { wifi: i % 2 === 0, pool: i % 3 === 0 },
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

// Ensure we start a test with no star/facility filters selected (idempotent)
async function ensureNoFiltersSelected() {
  const boxes = screen.queryAllByRole("checkbox");
  for (const box of boxes) {
    // If a box is checked, click to uncheck it
    if (box.checked) {
      await userEvent.click(box);
    }
  }
}

// --- Pagination tests (your originals, intact) ---
describe("SearchResults pagination", () => {
  test("shows 10 items per page, navigates through pages, sorting by rating (default)", async () => {
    const hotels = buildHotels(23); // expect 3 pages (10, 10, 3)
    renderWithRouter(hotels);

    // Page 1 indicator and count
    expect(await screen.findByText(/Page 1 of 3/i)).toBeInTheDocument();
    let cards = await screen.findAllByTestId("hotel-card-proxy-id");
    expect(cards).toHaveLength(10);

    // expected names per page with rating-desc default sort
    const sortedByRatingDesc = [...hotels].sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    );
    const expectedPage1 = sortedByRatingDesc.slice(0, 10).map((h) => h.name);
    const expectedPage2 = sortedByRatingDesc.slice(10, 20).map((h) => h.name);
    const expectedPage3 = sortedByRatingDesc.slice(20).map((h) => h.name);

    expectedPage1.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole("button", { name: /previous/i });
    const nextBtn = screen.getByRole("button", { name: /next/i });

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

    // Back to page 2
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

// --- Filtering tests (price range, stars, facilities, pagination reset) ---
describe("SearchResults filtering", () => {
  test("Price range filter reduces visible hotels and hides pagination when ≤ 10 remain", async () => {
    // 11 hotels -> initially 2 pages (10 + 1)
    const hotels = buildElevenHotels();
    renderWithRouter(hotels);

    // Initially -> 11 results => Page 1 of 2 visible
    expect(await screen.findByText(/Page 1 of 2/i)).toBeInTheDocument();
    expect(await screen.findAllByTestId("hotel-card-proxy-id")).toHaveLength(
      10
    );

    // Slide mocked price MAX down to 500 → keep only prices <= 500
    const slider = screen.getByTestId("price-slider");
    fireEvent.change(slider, { target: { value: "500" } });

    // Now only P1..P9 (100..500) remain: 9 results => no pagination
    const remainingNames = [
      "Hotel P1",
      "Hotel P2",
      "Hotel P3",
      "Hotel P4",
      "Hotel P5",
      "Hotel P6",
      "Hotel P7",
      "Hotel P8",
      "Hotel P9",
    ];
    for (const name of remainingNames) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
    expect(screen.queryByText("Hotel P10")).not.toBeInTheDocument();
    expect(screen.queryByText("Hotel P11")).not.toBeInTheDocument();

    expect(screen.queryByText(/Page \d+ of \d+/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /previous/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next/i })
    ).not.toBeInTheDocument();
  });

  test("Combines star rating and facilities filters with price range (AND semantics)", async () => {
    const hotels = buildMixedHotels();
    renderWithRouter(hotels);

    // Initially all 5 visible (≤10 so no pagination)
    for (const h of hotels) {
      expect(await screen.findByText(h.name)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Page \d+ of \d+/i)).not.toBeInTheDocument();

    // Select 5-star
    const fiveStar = screen.getByLabelText("5 Star");
    await userEvent.click(fiveStar);

    // Only rating === 5 should remain: Grand Plaza, Royal Suites
    expect(await screen.findByText("Grand Plaza")).toBeInTheDocument();
    expect(await screen.findByText("Royal Suites")).toBeInTheDocument();
    expect(screen.queryByText("City Hotel")).not.toBeInTheDocument();
    expect(screen.queryByText("Comfort Stay")).not.toBeInTheDocument();
    expect(screen.queryByText("Budget Inn")).not.toBeInTheDocument();

    // Require WiFi too
    const wifi = screen.getByLabelText("WiFi");
    await userEvent.click(wifi);

    // Of the 5-star hotels, only Grand Plaza has wifi:true
    expect(await screen.findByText("Grand Plaza")).toBeInTheDocument();
    expect(screen.queryByText("Royal Suites")).not.toBeInTheDocument();

    // Constrain price max to 2500 → excludes Grand Plaza (3000) → no matches
    const slider = screen.getByTestId("price-slider"); //mock slider
    fireEvent.change(slider, { target: { value: "2500" } });

    expect(screen.queryByTestId("hotel-card-proxy-id")).not.toBeInTheDocument();
    expect(
      await screen.findByText(/No hotels found matching your criteria/i)
    ).toBeInTheDocument();
  });
});
