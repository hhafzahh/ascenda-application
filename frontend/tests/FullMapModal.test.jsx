import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import FullMapModal from "../src/components/FullMapModal";

// Mock react-icons
jest.mock("react-icons/fi", () => ({
  FiX: () => <div data-testid="close-icon">X</div>
}));

// Mock MapView component
jest.mock("../src/components/MapView", () => {
  return jest.fn(({ hotels, onMarkerClick, height }) => (
    <div 
      data-testid="map-view-fullscreen" 
      data-hotels-count={hotels?.length || 0}
      data-height={height}
      onClick={() => onMarkerClick && onMarkerClick("hotel1")}
    >
      Full Screen MapView
    </div>
  ));
});

// Mock HotelCard component
jest.mock("../src/components/HotelCard", () => {
  return jest.fn(({ hotel, isCompact }) => (
    <div 
      data-testid={`hotel-card-${hotel.id}`}
      data-compact={isCompact}
    >
      <h3>{hotel.name}</h3>
      <p>${hotel.price}</p>
    </div>
  ));
});

// Mock ReactDOM.createPortal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node) => node,
}));

const mockHotels = [
  {
    id: "hotel1",
    name: "Test Hotel 1",
    price: 150,
    latitude: 1.2800945,
    longitude: 103.8509491,
    address: "123 Test Street"
  },
  {
    id: "hotel2",
    name: "Test Hotel 2",
    price: 200,
    latitude: 1.2900945,
    longitude: 103.8609491,
    address: "456 Test Avenue"
  }
];

describe("FullMapModal Component", () => {
  let mockOnClose;
  let mockOnMarkerClick;
  
  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnMarkerClick = jest.fn();
    jest.clearAllMocks();
    
    // Mock document.body.style
    Object.defineProperty(document.body, 'style', {
      value: { overflow: '' },
      writable: true
    });
  });

  afterEach(() => {
    // Clean up document.body.style (after each test)
    document.body.style.overflow = '';
  });

  test("renders modal with correct structure", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId("close-icon")).toBeInTheDocument();
    expect(screen.getByText("← Back to Hotel List")).toBeInTheDocument();
    expect(screen.getByText("Available Hotels")).toBeInTheDocument();
    expect(screen.getByTestId("map-view-fullscreen")).toBeInTheDocument();
  });

  test("renders all hotel cards", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId("hotel-card-hotel1")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-card-hotel2")).toBeInTheDocument();
  });

  test("displays hotel information correctly", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Test Hotel 1")).toBeInTheDocument();
    expect(screen.getByText("Test Hotel 2")).toBeInTheDocument();
    expect(screen.getByText("$150")).toBeInTheDocument();
    expect(screen.getByText("$200")).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    const closeButton = screen.getByTestId("close-icon").closest('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when back to hotel list button is clicked", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    const backButton = screen.getByText("← Back to Hotel List");
    fireEvent.click(backButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("passes correct props to MapView", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    const mapView = screen.getByTestId("map-view-fullscreen");
    expect(mapView).toHaveAttribute("data-hotels-count", "2");
    expect(mapView).toHaveAttribute("data-height", "100%");
  });

  test("calls onMarkerClick when map marker is clicked", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    const mapView = screen.getByTestId("map-view-fullscreen");
    fireEvent.click(mapView);
    
    expect(mockOnMarkerClick).toHaveBeenCalledWith("hotel1");
  });

  test("handles empty hotels array", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={[]} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Available Hotels")).toBeInTheDocument();
    expect(screen.getByTestId("map-view-fullscreen")).toHaveAttribute("data-hotels-count", "0");
    expect(screen.queryByTestId("hotel-card-hotel1")).not.toBeInTheDocument();
  });

  test("sets and cleans up document.body.overflow", () => {
    const { unmount } = render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    expect(document.body.style.overflow).toBe("hidden");
    
    unmount();
    
    expect(document.body.style.overflow).toBe("");
  });

  test("modal appears as fullscreen overlay", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    // Check if modal is rendered (just like verify it exists)
    expect(screen.getByTestId("close-icon")).toBeInTheDocument();
    expect(screen.getByTestId("map-view-fullscreen")).toBeInTheDocument();
  });

  test("renders hotel list sidebar", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    expect(screen.getByText("Available Hotels")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-card-hotel1")).toBeInTheDocument();
    expect(screen.getByTestId("hotel-card-hotel2")).toBeInTheDocument();
  });

  test("close button has correct accessibility attributes", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
          onMarkerClick={mockOnMarkerClick} 
        />
      </BrowserRouter>
    );
    
    const closeButton = screen.getByTestId("close-icon").closest('button');
    expect(closeButton).toHaveAttribute("aria-label", "Close Map");
  });

  test("handles undefined onMarkerClick prop", () => {
    render(
      <BrowserRouter>
        <FullMapModal 
          hotels={mockHotels} 
          onClose={mockOnClose} 
        />
      </BrowserRouter>
    );
    
    const mapView = screen.getByTestId("map-view-fullscreen");
    
    // Should not throw when clicking map without onMarkerClick
    expect(() => {
      fireEvent.click(mapView);
    }).not.toThrow();
  });
});
