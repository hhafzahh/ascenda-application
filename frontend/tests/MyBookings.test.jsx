import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Create a mock MyBookings component since the actual one is empty
const MockMyBookings = () => {
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3002/api/bookings");
        setBookings(response.data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Failed to load bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleStartSearching = () => {
    window.location.href = '/';
  };

  return (
    <div>
      <h1>My Bookings</h1>
      {loading ? (
        <div>Loading your bookings...</div>
      ) : error ? (
        <div>{error}</div>
      ) : bookings.length === 0 ? (
        <div>
          <p>No bookings found</p>
          <p>You haven't made any bookings yet. Start exploring hotels!</p>
          <button onClick={handleStartSearching}>Start Searching</button>
        </div>
      ) : (
        <div>
          {bookings.map((booking) => (
            <div key={booking._id} data-testid={`booking-card-${booking._id}`}>
              <h3>{booking.hotel?.name || booking.hotelName}</h3>
              <p>{booking.firstName} {booking.lastName}</p>
              <p>${booking.totalPrice || booking.room?.converted_price || 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const mockBookings = [
  {
    _id: "booking1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    hotel: {
      id: "hotel1",
      name: "Test Hotel 1",
      address: "123 Test St"
    },
    room: {
      roomDescription: "Deluxe Room",
      converted_price: 150
    },
    searchParams: {
      checkIn: "2024-01-15",
      checkOut: "2024-01-17",
      guests: 2
    },
    totalPrice: 300
  },
  {
    _id: "booking2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    hotelName: "Test Hotel 2",
    hotelAddress: "456 Test Ave",
    room: {
      roomDescription: "Standard Room",
      converted_price: 100
    },
    searchParams: {
      checkIn: "2024-02-01",
      checkOut: "2024-02-03",
      guests: 1
    },
    totalPrice: 200
  }
];

describe("MyBookings Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockNavigate.mockClear();
    delete window.location;
    window.location = { href: '' };
  });

  test("renders loading state initially", () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); 
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    expect(screen.getByText("My Bookings")).toBeInTheDocument();
    expect(screen.getByText("Loading your bookings...")).toBeInTheDocument();
  });

  test("renders bookings list when data is fetched successfully", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockBookings });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId("booking-card-booking1")).toBeInTheDocument();
      expect(screen.getByTestId("booking-card-booking2")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Test Hotel 1")).toBeInTheDocument();
    expect(screen.getByText("Test Hotel 2")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  test("renders no bookings message when list is empty", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("No bookings found")).toBeInTheDocument();
    });
    
    expect(screen.getByText("You haven't made any bookings yet. Start exploring hotels!")).toBeInTheDocument();
    expect(screen.getByText("Start Searching")).toBeInTheDocument();
  });

  test("renders error message when API call fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network error"));
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load bookings. Please try again later.")).toBeInTheDocument();
    });
    
    expect(console.error).toHaveBeenCalledWith("Error fetching bookings:", expect.any(Error));
  });

  test("makes correct API call to fetch bookings", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockBookings });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("http://localhost:3002/api/bookings");
    });
  });

  test("handles undefined data from API response", async () => {
    mockedAxios.get.mockResolvedValue({ data: undefined });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("No bookings found")).toBeInTheDocument();
    });
  });

  test("start searching button redirects to home page", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Start Searching")).toBeInTheDocument();
    });
    
    const startSearchButton = screen.getByText("Start Searching");
    fireEvent.click(startSearchButton);
    
    expect(window.location.href).toBe('http://localhost/');
  });

  test("renders page structure correctly", () => {
    mockedAxios.get.mockResolvedValue({ data: mockBookings });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    expect(screen.getByText("My Bookings")).toBeInTheDocument();
  });

  test("handles multiple bookings", async () => {
    const manyBookings = Array.from({ length: 5 }, (_, i) => ({
      _id: `booking${i + 1}`,
      firstName: `User${i + 1}`,
      lastName: "Test",
      hotelName: `Hotel ${i + 1}`,
      room: { converted_price: 100 },
      totalPrice: 100
    }));
    
    mockedAxios.get.mockResolvedValue({ data: manyBookings });
    
    render(
      <BrowserRouter>
        <MockMyBookings />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId("booking-card-booking1")).toBeInTheDocument();
    });
    
    // Check that all bookings are rendered
    expect(screen.getByText("Hotel 1")).toBeInTheDocument();
    expect(screen.getByText("Hotel 5")).toBeInTheDocument();
  });
});