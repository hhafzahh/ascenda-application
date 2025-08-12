import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import MiniMap from "../src/components/Minimap";

// Mock Leaflet
jest.mock("leaflet", () => ({
  Icon: jest.fn().mockImplementation(() => ({
    iconUrl: "test-blue-marker.png",
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -40],
    shadowUrl: "test-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  })),
}));

// Mock react-leaflet components
jest.mock("react-leaflet", () => ({
  MapContainer: jest.fn(({ children, center, zoom, scrollWheelZoom, style }) => (
    <div 
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      data-scroll-wheel-zoom={scrollWheelZoom.toString()}
      style={style}
    >
      {children}
    </div>
  )),
  TileLayer: jest.fn(({ attribution, url }) => (
    <div 
      data-testid="tile-layer"
      data-attribution={attribution}
      data-url={url}
    />
  )),
  Marker: jest.fn(({ children, position, icon }) => (
    <div 
      data-testid="marker"
      data-position={JSON.stringify(position)}
      data-icon={icon ? "custom-blue-icon" : "default-icon"}
    >
      {children}
    </div>
  )),
  Popup: jest.fn(({ children }) => (
    <div data-testid="popup">{children}</div>
  )),
}));

// Mock CSS import
jest.mock("leaflet/dist/leaflet.css", () => {});

describe("MiniMap Component", () => {
  const defaultProps = {
    lat: 1.2800945,
    lng: 103.8509491,
    hotelName: "Test Hotel",
    price: "150.00"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders MiniMap with valid coordinates", () => {
    render(<MiniMap {...defaultProps} />);
    
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("marker")).toBeInTheDocument();
    expect(screen.getByTestId("popup")).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
  });

  test("sets correct map properties", () => {
    render(<MiniMap {...defaultProps} />);
    
    const mapContainer = screen.getByTestId("map-container");
    expect(mapContainer).toHaveAttribute("data-center", JSON.stringify([1.2800945, 103.8509491]));
    expect(mapContainer).toHaveAttribute("data-zoom", "16");
  });

  test("displays hotel information", () => {
    render(<MiniMap {...defaultProps} />);
    
    const popup = screen.getByTestId("popup");
    expect(popup).toHaveTextContent("Test Hotel");
    expect(popup).toHaveTextContent("Price: $150.00");
  });

  test("returns null when coordinates missing", () => {
    const { container } = render(<MiniMap hotelName="No Coords Hotel" price="150.00" />);
    expect(container.firstChild).toBeNull();
  });

  test("handles missing price", () => {
    const propsWithoutPrice = {
      lat: 1.2800945,
      lng: 103.8509491,
      hotelName: "No Price Hotel"
    };
    
    render(<MiniMap {...propsWithoutPrice} />);
    
    const popup = screen.getByTestId("popup");
    expect(popup).toHaveTextContent("Price: $N/A");
  });

  test("marker displays correctly", () => {
    render(<MiniMap {...defaultProps} />);
    
    const marker = screen.getByTestId("marker");
    expect(marker).toHaveAttribute("data-position", JSON.stringify([1.2800945, 103.8509491]));
    expect(marker).toHaveAttribute("data-icon", "custom-blue-icon");
  });
});
