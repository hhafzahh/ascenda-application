// This file tests the complete authentication flow: registration → login → profile access
import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

import Registration from "../src/pages/Register/Register";
import Login from "../src/pages/Login/Login";
import Profile from "../src/pages/Profile";

// Mock axios to simulate API calls without a real backend
jest.mock("axios");
// Increase timeout for async operations
jest.setTimeout(15000);

// This component helps us track the current route in our tests
// It displays the current path, which we can check in our assertions
function WhereAmI() {
  const loc = useLocation();
  return <div data-testid="whereami">{loc.pathname}</div>;
}

// Test version of our app that allows us to:
// 1. Start at any route we want using initialPath
// 2. Implement route protection based on auth token
// 3. Include a route tracker (WhereAmI) for test assertions
function App({ initialPath = "/register" }) {
  // Check if user is authenticated by looking for a token
  const isAuthed = !!sessionStorage.getItem("token");
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <WhereAmI />
      <Routes>
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          // Protect the profile route: redirect to login if not authenticated
          element={isAuthed ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// Helper functions to make tests more readable and maintainable

// Fills out the registration form with provided data
// Uses userEvent to simulate realistic user typing
async function fillRegisterForm(u, { name, email, password, dob }) {
  await u.type(screen.getByPlaceholderText(/enter your full name/i), name);
  await u.type(screen.getByLabelText(/date of birth/i), dob);
  await u.type(screen.getByPlaceholderText(/enter your email address/i), email);
  await u.type(screen.getByPlaceholderText(/enter your password/i), password);
}

// Gets login form inputs from the DOM
// Throws an error if they're not found to fail tests early
function getLoginInputs(container) {
  const email = container.querySelector('input[type="email"]');
  const password = container.querySelector('input[type="password"]');
  if (!email || !password) throw new Error("Login inputs not found");
  return { email, password };
}

describe("Auth integration flow", () => {
  // Reset all state before each test to ensure they're independent
  beforeEach(() => {
    cleanup();                // Clean up DOM
    jest.useRealTimers();    // Use real timers for setTimeout/setInterval
    jest.resetAllMocks();    // Reset all mocked functions
    sessionStorage.clear();   // Clear any stored auth tokens
  });

  // This test verifies the complete user journey: register → login → view profile
  test("happy path: register, login, then profile loads", async () => {
    // Setup userEvent to simulate realistic user interactions
    const user = userEvent.setup();

    // Mock successful registration response
    axios.post.mockResolvedValueOnce({ status: 201, data: {} });
    render(<App initialPath="/register" />);

    // Fill out registration form
    await fillRegisterForm(user, {
      name: "Alice Doe",
      email: "alice@example.com",
      password: "secret1",
      dob: "2000-01-01"
    });
    // Submit registration
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify registration success and wait for redirect
    await screen.findByText(/registration successful! redirecting to login/i);
    // Wait up to 3 seconds for redirect to complete
    await waitFor(
      () => expect(screen.getByTestId("whereami")).toHaveTextContent("/login"),
      { timeout: 3000 }
    );

    // Mock successful login response with auth tokens
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { userId: "u123", token: "t456" },
    });

    // Fill out login form with same credentials used in registration
    const loginEmail = screen.getByPlaceholderText(/enter your email address/i);
    const loginPassword = screen.getByPlaceholderText(/enter your password/i);
    await user.type(loginEmail, "alice@example.com");
    await user.type(loginPassword, "secret1");
    await user.click(screen.getByRole("button", { name: /log\s*in/i }));

    // Verify that auth tokens were stored in sessionStorage
    expect(sessionStorage.getItem("userId")).toBe("u123");
    expect(sessionStorage.getItem("token")).toBe("t456");

    // Mock profile data response for when we visit the profile page
    axios.get.mockResolvedValueOnce({
      data: { username: "Alice Doe", email: "alice@example.com", dob: "2000-01-01" },
    });
    cleanup(); // Clean up before rendering new page
    render(<App initialPath="/profile" />);

    // Verify we're on profile page and user data is displayed
    expect(screen.getByTestId("whereami")).toHaveTextContent("/profile");
    expect(await screen.findByDisplayValue("Alice Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
  });

  // Test that unauthorized users can't access protected routes
  test("route guard: visiting /profile without token redirects to /login", async () => {
    const { container } = render(<App initialPath="/profile" />);
    // Should be redirected to login page
    expect(await screen.findByTestId("whereami")).toHaveTextContent("/login");
    // Login form should be displayed
    const { email, password } = getLoginInputs(container);
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
  });

  // Test error handling during registration
  test("register error: shows server error and stays on /register", async () => {
    const user = userEvent.setup();
    // Mock a server error response (email already taken)
    axios.post.mockRejectedValueOnce({
      response: { data: { error: "Email already exists" } },
    });

    render(<App initialPath="/register" />);
    await fillRegisterForm(user, { name: "Bob", email: "bob@example.com", dob: "2000-01-01", password: "secret1" });
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
    expect(screen.getByTestId("whereami")).toHaveTextContent("/register");
  });

  // Test login error handling and state management
  test("login error: shows error and stays on /login (no session set)", async () => {
    const user = userEvent.setup();
    // Mock a network error during login
    axios.post.mockRejectedValueOnce(new Error("Network"));

    const { container } = render(<App initialPath="/login" />);
    const { email, password } = getLoginInputs(container);

    // Try to log in with incorrect credentials
    await user.type(email, "alice@example.com");
    await user.type(password, "wrongpass");
    await user.click(screen.getByRole("button", { name: /log\s*in/i }));

    // Verify error handling:
    // 1. Error message is shown
    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
    // 2. No token was stored (user remains logged out)
    expect(sessionStorage.getItem("token")).toBeNull();
    // 3. User stays on login page
    expect(screen.getByTestId("whereami")).toHaveTextContent("/login");
    // 4. Login form is still available for retry
    expect(container.querySelector('button[type="submit"]')).toBeInTheDocument();
  });

  test("register success navigates to login after 2s (timer assertion)", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValueOnce({ status: 201, data: {} });

    render(<App initialPath="/register" />);
    await fillRegisterForm(user, { name: "Carol", email: "carol@example.com",dob: "2000-01-01", password: "secret1" });

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // See success, then within ~3s route changes to /login
    await screen.findByText(/registration successful! redirecting to login/i);
    await waitFor(
      () => expect(screen.getByTestId("whereami")).toHaveTextContent("/login"),
      { timeout: 3000 }
    );
  });

  // Test that successful login notifies other parts of the application
  test('login success dispatches "custom-login-event"', async () => {
    const user = userEvent.setup();
    // Create a spy to track if the event was fired
    const eventSpy = jest.fn();
    window.addEventListener("custom-login-event", eventSpy);

    // Mock successful login response
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { userId: "u789", token: "tok999" },
    });

    // Perform login
    const { container } = render(<App initialPath="/login" />);
    const { email, password } = getLoginInputs(container);
    await user.type(email, "eve@example.com");
    await user.type(password, "secret1");
    await user.click(screen.getByRole("button", { name: /log\s*in/i }));

    // Verify that login event was dispatched
    expect(eventSpy).toHaveBeenCalled();
    // Clean up event listener
    window.removeEventListener("custom-login-event", eventSpy);
  });
});
