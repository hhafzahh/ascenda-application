import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock CSS import
jest.mock("components/BookingForm/BookingForm.css", () => {});

// Mock fetch
global.fetch = jest.fn();

import BookingForm from "components/BookingForm";

const mockRoom = {
  roomDescription: "Deluxe King Room",
  converted_price: 150.00,
  amenities: ["WiFi", "Air Conditioning", "Mini Bar"]
};

const mockSearchParams = {
  checkIn: "2024-01-15",
  checkOut: "2024-01-17",
  guests: 2,
  destinationId: "WD0M"
};

const mockHotel = {
  id: "hotel123",
  name: "Test Hotel",
  address: "123 Test Street, Test City"
};

describe("BookingForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  test("renders booking form with all required fields", () => {
    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    expect(screen.getByText("Complete Your Booking")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address *")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone Number *")).toBeInTheDocument();
    expect(screen.getByText("I am booking for someone else")).toBeInTheDocument();
    expect(screen.getByLabelText("Special Requests")).toBeInTheDocument();
  });

  test("allows user to fill in personal information", () => {
    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    const titleSelect = screen.getByLabelText("Title");
    const firstNameInput = screen.getByLabelText("First Name *");
    const lastNameInput = screen.getByLabelText("Last Name *");
    const emailInput = screen.getByLabelText("Email Address *");

    fireEvent.change(titleSelect, { target: { value: "Mr" } });
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john.doe@email.com" } });

    expect(titleSelect.value).toBe("Mr");
    expect(firstNameInput.value).toBe("John");
    expect(lastNameInput.value).toBe("Doe");
    expect(emailInput.value).toBe("john.doe@email.com");
  });

  test("allows user to select country code and enter phone number", () => {
    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    const countryCodeSelect = screen.getByDisplayValue("+65 (SG)");
    const mobileInput = screen.getByLabelText("Phone Number *");

    fireEvent.change(countryCodeSelect, { target: { value: "+1" } });
    fireEvent.change(mobileInput, { target: { value: "1234567890" } });

    expect(countryCodeSelect.value).toBe("+1");
    expect(mobileInput.value).toBe("1234567890");
  });

  test("allows user to toggle booking for someone else checkbox", () => {
    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    const checkbox = screen.getByRole("checkbox", { name: /I am booking for someone else/i });

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  test("allows user to enter special requests", () => {
    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    const specialRequestsTextarea = screen.getByLabelText("Special Requests");

    fireEvent.change(specialRequestsTextarea, { 
      target: { value: "Late check-in please" } 
    });

    expect(specialRequestsTextarea.value).toBe("Late check-in please");
  });

  test("navigates back when back button clicked", () => {
    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    const backButton = screen.getByText("← Back");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test("submits form with valid data", async () => {
    const mockResponse = { _id: "booking123" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Mr",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          countryCode: "+65",
          mobile: "1234567890",
          bookingForSomeone: false,
          room: mockRoom,
          searchParams: mockSearchParams,
          specialRequests: "",
          hotel: mockHotel,
          hotelName: mockHotel.name,
          hotelAddress: mockHotel.address,
        })
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/confirmation", {
        state: {
          bookingId: "booking123",
          hotel: mockHotel
        }
      });
    });
  });

  test("shows loading state during form submission", async () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    expect(screen.getByText("← Back")).toBeDisabled();
  });

  test("handles API error during submission", async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request")
    });

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to create booking. Please try again.");
    });

    expect(screen.getByText("Continue to Confirmation →")).toBeInTheDocument();

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test("handles network error during submission", async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to create booking. Please try again.");
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test("handles missing booking ID in response", async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}) // No _id in response
    });

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to create booking. Please try again.");
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test("includes special requests in submission data", async () => {
    const mockResponse = { _id: "booking123" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Special Requests"), { target: { value: "Late check-in please" } });

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Mr",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          countryCode: "+65",
          mobile: "1234567890",
          bookingForSomeone: false,
          room: mockRoom,
          searchParams: mockSearchParams,
          specialRequests: "Late check-in please",
          hotel: mockHotel,
          hotelName: mockHotel.name,
          hotelAddress: mockHotel.address,
        })
      });
    });
  });

  test("includes bookingForSomeone flag when checked", async () => {
    const mockResponse = { _id: "booking123" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(
      <BrowserRouter>
        <BookingForm room={mockRoom} searchParams={mockSearchParams} hotel={mockHotel} />
      </BrowserRouter>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Mr" } });
    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "john.doe@email.com" } });
    fireEvent.change(screen.getByLabelText("Phone Number *"), { target: { value: "1234567890" } });
    
    const checkbox = screen.getByRole("checkbox", { name: /I am booking for someone else/i });
    fireEvent.click(checkbox);

    const submitButton = screen.getByText("Continue to Confirmation →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Mr",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          countryCode: "+65",
          mobile: "1234567890",
          bookingForSomeone: true,
          room: mockRoom,
          searchParams: mockSearchParams,
          specialRequests: "",
          hotel: mockHotel,
          hotelName: mockHotel.name,
          hotelAddress: mockHotel.address,
        })
      });
    });
  });
});