import "@testing-library/jest-dom";
import "whatwg-fetch";
import { render, screen, waitFor } from "@testing-library/react";
import SearchResults from "../src/pages/SearchResults"; // Adjust the import according to the actual location
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import React from "react";
const axios = require("axios");

jest.mock("axios");
const mockSearchParams = {
  destinationId: "123",
  checkin: "2025-08-15",
  checkout: "2025-08-20",
  guests: 2,
};
// Mock Leaflet and react-leaflet components
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

// Mock useLocation to return mock state
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
}));

test("Search Bar renders with correct props from location.state", async () => {
  const mockState = {
    hotels: [
      { id: 1, name: "Hotel A" },
      { id: 2, name: "Hotel B" },
    ],
    searchQuery: "Test Location",
    destinationId: "123",
    checkin: new Date("2025-08-15"),
    checkout: new Date("2025-08-20"),
    guests: 2,
  };

  // Mock useLocation to return the mock state
  useLocation.mockReturnValue({
    state: mockState,
  });

  render(
    <MemoryRouter initialEntries={["/results"]}>
      <Routes>
        <Route path="/results" element={<SearchResults />} />
      </Routes>
    </MemoryRouter>
  );

  // Debugging the output to inspect rendered DOM
  //screen.debug();

  // Check if the SearchBar is rendered
  const searchBar = screen.getByTestId("search-bar");
  expect(searchBar).toBeInTheDocument();

  // Check that SearchBar fields are pre-filled with mockState values
  expect(screen.getByDisplayValue(mockState.searchQuery)).toBeInTheDocument();
  expect(screen.getByDisplayValue("08/15/2025")).toBeInTheDocument(); // check-in
  expect(screen.getByDisplayValue("08/20/2025")).toBeInTheDocument(); // check-out
  expect(
    screen.getByDisplayValue(mockState.guests.toString())
  ).toBeInTheDocument();
});
