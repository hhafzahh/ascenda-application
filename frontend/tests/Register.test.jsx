// Tests for the registration form covering:
// - Form validation
// - API interactions
// - Success/error handling
// - Navigation flows
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import Registration from "../src/pages/Register/Register"; 

// Mock API calls to prevent network requests during tests
jest.mock("axios");
const mockNavigate = jest.fn();

// Mock router while keeping other functionality
// Allows testing navigation after registration
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Reset mocks and timers between tests to prevent interference
afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe("Registration", () => {
  // Verify all required form elements are present
  test("renders the form", () => {
    render(<Registration />);
    // Check for essential form elements using semantic queries
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  // Verify form validation for multiple field errors
  test("shows validation errors when fields are invalid", async () => {
    render(<Registration />);

    // Input invalid data while avoiding browser validation
    await userEvent.type(screen.getByPlaceholderText(/enter your full name/i), " "); // whitespace only
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), "a@b.com"); // valid format
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "123"); // too short

    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify appropriate error messages
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    // No API call should be made with invalid data
    expect(axios.post).not.toHaveBeenCalled();
  });

  // Verify error messages clear when users fix invalid input
  test("clears field-level error on change", async () => {
    render(<Registration />);

    // Submit form with invalid name to trigger error
    await userEvent.type(screen.getByPlaceholderText(/enter your full name/i), " ");
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify error message appears
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();

    // Enter valid name and verify error clears
    await userEvent.clear(screen.getByPlaceholderText(/enter your full name/i));
    await userEvent.type(screen.getByPlaceholderText(/enter your full name/i), "Alice Doe");

    await waitFor(() =>
      expect(screen.queryByText(/full name is required/i)).not.toBeInTheDocument()
    );
  });

  // Test successful registration flow with delayed navigation
  test("successful registration (201): shows message and navigates after 2s", async () => {
    axios.post.mockResolvedValue({ status: 201, data: {} });

    render(<Registration />);
    // Fill form with valid data
    await userEvent.type(screen.getByPlaceholderText(/enter your full name/i), "Alice Doe");
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), "alice@example.com");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "secret1");

    // Control timer for testing delayed navigation
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify success message appears
    expect(
      await screen.findByText(/registration successful! redirecting to login/i)
    ).toBeInTheDocument();

    // Fast-forward the redirect timeout
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  // Verify appropriate handling of API errors
  test("API error: shows backend error and does not navigate", async () => {
    // Simulate API error for duplicate email
    axios.post.mockRejectedValue({
      response: { data: { error: "Email already exists" } },
    });

    render(<Registration />);
    // Submit form with valid data
    await userEvent.type(screen.getByPlaceholderText(/enter your full name/i), "Bob");
    await userEvent.type(screen.getByPlaceholderText(/enter your email address/i), "bob@example.com");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "secret1");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify error handling
    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Verify direct navigation to login page
  test('clicking "Log In" navigates immediately', async () => {
    render(<Registration />);
    await userEvent.click(screen.getByText(/log in/i));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
