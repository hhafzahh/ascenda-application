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

// Mock Stripe hooks and elements
const mockStripe = {
  confirmCardPayment: jest.fn()
};

const mockElements = {
  getElement: jest.fn()
};

const mockCardElement = {};

jest.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  CardNumberElement: ({ options, ...props }) => (
    <div data-testid="card-number-element" {...props}>Card Number Element</div>
  ),
  CardExpiryElement: ({ options, ...props }) => (
    <div data-testid="card-expiry-element" {...props}>Card Expiry Element</div>
  ),
  CardCvcElement: ({ options, ...props }) => (
    <div data-testid="card-cvc-element" {...props}>Card CVC Element</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

// Suppress console errors for cleaner test output
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
  console.error.mockRestore();
});

import CheckoutForm from "../src/components/CheckoutForm";

const mockBooking = {
  _id: "booking123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@email.com",
  room: {
    roomDescription: "Deluxe King Room",
    converted_price: 150.00,
    amenities: ["WiFi", "Air Conditioning"]
  }
};

const mockBookingWithPrice = {
  ...mockBooking,
  room: {
    roomDescription: "Standard Room",
    price: 120.00
  }
};

describe("CheckoutForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockNavigate.mockClear();
    mockStripe.confirmCardPayment.mockClear();
    mockElements.getElement.mockReturnValue(mockCardElement);
  });

  test("renders checkout form with payment elements", () => {
    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    expect(screen.getByText("Payment Details")).toBeInTheDocument();
    expect(screen.getByText("Complete your booking with secure payment")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name as it appears on card")).toBeInTheDocument();
    expect(screen.getByTestId("card-number-element")).toBeInTheDocument();
    expect(screen.getByTestId("card-expiry-element")).toBeInTheDocument();
    expect(screen.getByTestId("card-cvc-element")).toBeInTheDocument();
  });

  test("displays payment summary correctly", () => {
    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    expect(screen.getByText("Payment Summary")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Deluxe King Room")).toBeInTheDocument();
    // Check that $150.00 appears exactly twice (room rate and total)
    const priceElements = screen.getAllByText("$150.00");
    expect(priceElements).toHaveLength(2);
  });

  test("allows user to enter cardholder name", () => {
    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const cardholderInput = screen.getByPlaceholderText("Name as it appears on card");
    fireEvent.change(cardholderInput, { target: { value: "John Doe" } });

    expect(cardholderInput.value).toBe("John Doe");
  });

  test("processes payment successfully", async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    // Mock successful payment intent creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "pi_test_client_secret" })

    })
      // Mock successful booking creation (2nd fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ _id: "bk_1" })
      });

    // Mock successful payment confirmation
    mockStripe.confirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { status: "succeeded" }
    });

    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const cardholderInput = screen.getByPlaceholderText("Name as it appears on card");
    fireEvent.change(cardholderInput, { target: { value: "John Doe" } });

    const submitButton = screen.getByText("Pay Now →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 15000 }) // 150.00 * 100
      });
    });

    await waitFor(() => {
      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith("pi_test_client_secret", {
        payment_method: {
          card: mockCardElement,
          billing_details: {
            name: "John Doe",
            email: "john.doe@email.com"
          }
        }
      });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Payment successful! Booking confirmed.");
      expect(mockNavigate).toHaveBeenCalledWith("/my-bookings");
    });

    alertSpy.mockRestore();
  });

  test("handles payment failure", async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    // Mock successful payment intent creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "pi_test_client_secret" })
    });

    // Mock payment failure
    mockStripe.confirmCardPayment.mockResolvedValueOnce({
      error: { message: "Your card was declined." }
    });

    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const cardholderInput = screen.getByPlaceholderText("Name as it appears on card");
    fireEvent.change(cardholderInput, { target: { value: "John Doe" } });

    const submitButton = screen.getByText("Pay Now →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Payment failed: Your card was declined.");
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  test("handles payment intent creation failure", async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    // Mock failed payment intent creation
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400
    });

    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const cardholderInput = screen.getByPlaceholderText("Name as it appears on card");
    fireEvent.change(cardholderInput, { target: { value: "John Doe" } });

    const submitButton = screen.getByText("Pay Now →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Payment failed. Please try again.");
    });

    alertSpy.mockRestore();
  });

  test("shows loading state during payment processing", async () => {
    // Mock payment intent creation that never resolves
    fetch.mockImplementation(() => new Promise(() => { }));

    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const cardholderInput = screen.getByPlaceholderText("Name as it appears on card");
    fireEvent.change(cardholderInput, { target: { value: "John Doe" } });

    const submitButton = screen.getByText("Pay Now →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Processing Payment...")).toBeInTheDocument();
    });

    expect(screen.getByText("← Back")).toBeDisabled();
    expect(screen.getByText("Processing Payment...")).toBeDisabled();
  });

  test("navigates back when back button clicked", () => {
    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const backButton = screen.getByText("← Back");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test("handles booking with price field instead of converted_price", () => {
    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBookingWithPrice} />
      </BrowserRouter>
    );

    // Check that $120.00 appears exactly twice (room rate and total)
    const priceElements = screen.getAllByText("$120.00");
    expect(priceElements).toHaveLength(2);
  });

  test("handles booking with no price information", () => {
    const bookingWithoutPrice = {
      ...mockBooking,
      room: { roomDescription: "Standard Room" }
    };

    render(
      <BrowserRouter>
        <CheckoutForm booking={bookingWithoutPrice} />
      </BrowserRouter>
    );

    // Check that $0.00 appears for both room rate and total
    const priceElements = screen.getAllByText("$0.00");
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  test("uses correct amount for payment intent with price field", async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "pi_test_client_secret" })
    });

    mockStripe.confirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { status: "succeeded" }
    });

    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBookingWithPrice} />
      </BrowserRouter>
    );

    const cardholderInput = screen.getByPlaceholderText("Name as it appears on card");
    fireEvent.change(cardholderInput, { target: { value: "John Doe" } });

    const submitButton = screen.getByText("Pay Now →");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:3002/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 12000 }) // 120.00 * 100
      });
    });

    alertSpy.mockRestore();
  });

  // Simplified test that doesn't rely on complex mocking
  test("submit button is enabled when Stripe is loaded", () => {
    render(
      <BrowserRouter>
        <CheckoutForm booking={mockBooking} />
      </BrowserRouter>
    );

    const submitButton = screen.getByText("Pay Now →");
    // The button should be enabled by default since our mock provides Stripe
    expect(submitButton).not.toBeDisabled();
  });
});