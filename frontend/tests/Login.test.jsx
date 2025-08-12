// These tests verify that our login form works correctly in all scenarios:
// - Successful logins
// - Failed logins
// - Network errors
// - Input validation
// - Session storage
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import Login from "../src/pages/Login"; 

// We don't want to make real API calls in tests, so we mock axios
jest.mock("axios");

// In our app, we use React Router's useNavigate to redirect after login
// Here we create a mock function so we can check if navigation happened
const mockNavigate = jest.fn(); 

// Mock React Router but keep all its real functionality except navigation
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate, 
}));

describe("Login", () => {
  // Before each test:
  // 1. Reset all our mock functions so we start fresh
  // 2. Clear any leftover session storage from previous tests
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  // First, check that all the basic form elements are present
  // This is a simple smoke test to catch obvious rendering issues
  test("renders form fields", () => {
    render(<Login />);
    // We use getByRole where possible - it's better for accessibility testing
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    // Using getByLabelText ensures our form is properly labeled
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  // We should show an error if someone tries to login without entering anything
  // This saves a round trip to the server for obviously invalid submissions
  test("shows validation error when email or password is missing", async () => {
    // userEvent helps us simulate realistic user interactions
    const user = userEvent.setup();
    render(<Login />);
    
    // Make sure the fields are empty (in case there are default values)
    await user.clear(screen.getByLabelText(/email/i));
    await user.clear(screen.getByLabelText(/password/i));
    
    // Try to submit the empty form
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    // We should see an error message
    const errorMessage = await screen.findByText("Email and password are required");
    expect(errorMessage).toBeInTheDocument();
    // And we shouldn't have tried to call the API
    expect(axios.post).not.toHaveBeenCalled();
  });

  // This is our happy path test - everything works perfectly:
  // 1. User enters valid credentials
  // 2. Server returns success with all data
  // 3. App updates storage and redirects
  test("successful login: sets sessionStorage, dispatches event, navigates home", async () => {
    // Mock a successful response from the server
    axios.post.mockResolvedValue({
      status: 200,
      data: { userId: "u123", token: "t456" },
    });
    // We'll watch for the login event that other parts of the app might need
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    render(<Login />);
    // Simulate a user typing their credentials
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // Check that everything happened in the right order:
    // 1. User sees success message
    expect(await screen.findByText(/login successful/i)).toBeInTheDocument();
    // 2. Session storage is updated with user data
    expect(sessionStorage.getItem("userId")).toBe("u123");
    expect(sessionStorage.getItem("token")).toBe("t456");

    // 3. Login event is dispatched to notify other components
    expect(dispatchSpy).toHaveBeenCalled();
    const evt = dispatchSpy.mock.calls[0][0];
    expect(evt.type).toBe("custom-login-event");

    // 4. User is redirected to home page
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // Sometimes our API might not return a userId (maybe it's a simplified token-only auth)
  // We should still handle this case gracefully
  test("successful login without userId: still navigates, stores token", async () => {
    // Mock a successful response but only with a token
    axios.post.mockResolvedValue({
      status: 200,
      data: { token: "only-token" },
    });

    render(<Login />);
    // Go through the login process
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // Even without a userId, we should:
    // 1. Show success message
    expect(await screen.findByText(/login successful/i)).toBeInTheDocument();
    // 2. Handle missing userId gracefully
    expect(sessionStorage.getItem("userId")).toBeNull();
    // 3. Still store the token we did get
    expect(sessionStorage.getItem("token")).toBe("only-token");
    // 4. Navigate to home page
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // We want to be strict about what we consider a successful login
  // Even if the server responds with a "success-like" status code,
  // we only want to accept exactly status 200
  test("non-200 response shows error", async () => {
    // Mock a 201 Created response - successful but not what we want
    axios.post.mockResolvedValue({
      status: 201,
      data: { message: "Created but not OK" },
    });

    render(<Login />);
    // Go through normal login process
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // Should show error and not redirect
    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // This test handles the case where something goes really wrong
  // (network error, server down, etc.)
  test("failed login (axios rejects): shows error and does not navigate", async () => {
    // Simulate a network error or other API failure
    axios.post.mockRejectedValue(new Error("Network"));

    render(<Login />);
    // Attempt to log in
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // When login fails, we should:
    // 1. Show an error message to the user
    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
    // 2. Not redirect them anywhere
    expect(mockNavigate).not.toHaveBeenCalled();
    // 3. Make sure no auth data was accidentally saved
    expect(sessionStorage.getItem("userId")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});
