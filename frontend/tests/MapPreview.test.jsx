import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MapPreview from "../src/components/MapPreview";

// Mock react-icons
jest.mock("react-icons/fi", () => ({
  FiMaximize2: () => <div data-testid="maximize-icon">Maximize</div>
}));

// Mock MapView component
jest.mock("../src/components/MapView", () => {
  return jest.fn(({ hotels, height }) => (
    <div 
      data-testid="map-view-mock" 
      data-hotels-count={hotels?.length || 0}
      data-height={height}
    >
      MapView Component
    </div>
  ));
});

const mockHotels = [
  {
    id: "hotel1",
    name: "Test Hotel 1",
    lat: "1.2800945",
    lng: "103.8509491",
    converted_price: "150.00"
  },
  {
    id: "hotel2",
    name: "Test Hotel 2", 
    lat: "1.2900945",
    lng: "103.8609491",
    converted_price: "200.00"
  }
];

describe("MapPreview Component", () => {
  let mockOnClickExpand;

  beforeEach(() => {
    mockOnClickExpand = jest.fn();
    jest.clearAllMocks();
  });

  test("renders MapPreview with correct structure", () => {
    render(<MapPreview hotels={mockHotels} onClickExpand={mockOnClickExpand} />);
    
    expect(screen.getByTestId("map-view-mock")).toBeInTheDocument();
    expect(screen.getByTestId("maximize-icon")).toBeInTheDocument();
  });

  test("passes correct props to MapView", () => {
    render(<MapPreview hotels={mockHotels} onClickExpand={mockOnClickExpand} />);
    
    const mapView = screen.getByTestId("map-view-mock");
    expect(mapView).toHaveAttribute("data-hotels-count", "2");
    expect(mapView).toHaveAttribute("data-height", "220");
  });

  test("calls onClickExpand when expand button clicked", () => {
    render(<MapPreview hotels={mockHotels} onClickExpand={mockOnClickExpand} />);
    
    const expandButton = screen.getByLabelText("Expand Map");
    fireEvent.click(expandButton);
    
    expect(mockOnClickExpand).toHaveBeenCalledTimes(1);
  });

  test("handles empty hotels array", () => {
    render(<MapPreview hotels={[]} onClickExpand={mockOnClickExpand} />);
    
    const mapView = screen.getByTestId("map-view-mock");
    expect(mapView).toHaveAttribute("data-hotels-count", "0");
    expect(screen.getByTestId("maximize-icon")).toBeInTheDocument();
  });

  test("handles undefined hotels prop", () => {
    render(<MapPreview onClickExpand={mockOnClickExpand} />);
    
    const mapView = screen.getByTestId("map-view-mock");
    expect(mapView).toHaveAttribute("data-hotels-count", "0");
  });

  test("expand button has proper accessibility", () => {
    render(<MapPreview hotels={mockHotels} onClickExpand={mockOnClickExpand} />);
    
    const expandButton = screen.getByLabelText("Expand Map");
    expect(expandButton).toHaveAttribute("aria-label", "Expand Map");
  });

  test("handles missing onClickExpand prop", () => {
    expect(() => {
      render(<MapPreview hotels={mockHotels} />);
    }).not.toThrow();
    
    expect(screen.getByLabelText("Expand Map")).toBeInTheDocument();
  });
});
