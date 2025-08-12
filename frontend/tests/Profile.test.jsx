// This file tests the Profile page component which handles:
// - Displaying user information
// - Updating profile details
// - Changing passwords
// - Account deletion
// - Session management
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import Profile from "../src/pages/Profile";

// mock API call
jest.mock("axios");

// Helper function to mock window.alert and window.confirm
const setupAlertsAndConfirm = () => {
  const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  const confirmSpy = jest.spyOn(window, "confirm").mockImplementation(() => true);
  return { alertSpy, confirmSpy };
};

describe("Profile page", () => {
  // Before each test we need to:
  // 1. Reset all our mocks so they don't retain data between tests
  // 2. Clear any leftover session data
  // 3. Set up a fake user ID as if someone is logged in
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("userId", "u123");
  });


  // smoke test to ensure the component works
  test("loads and displays user profile (name & email)", async () => {
    // Mock the API to return some user data
    axios.get.mockResolvedValue({
      data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
    });

    render(<Profile />);

    // component should show the user's information in editable fields
    // we use findByDisplayValue because the data loads asynchronously
    expect(await screen.findByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
  });

  // Users should be able to change their name and save the changes
  test("edit name and Save -> sends PUT and alerts success", async () => {
    // Set up alert spy to check for success messages
    const { alertSpy } = setupAlertsAndConfirm();

    axios.get.mockResolvedValue({
      data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
    });
    axios.put.mockResolvedValue({});

    render(<Profile />);

    const nameInput = await screen.findByDisplayValue("Alice");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Alice Smith");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:3004/api/user/u123",
        { username: "Alice Smith", dob: "2000-01-01" }
      );
    });
    expect(alertSpy).toHaveBeenCalledWith("Profile updated successfully!");
  });

  // ensure users can't submit mismatched passwords when changing passwords
  test("toggle Change Password, mismatch -> alerts, no PUT", async () => {
    // Set up our alert spy to catch the error message
    const { alertSpy } = setupAlertsAndConfirm();

    // Mock the initial profile load
    axios.get.mockResolvedValue({
      data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
    });

    const { container } = render(<Profile />);

    // Wait for profile to load
    await screen.findByDisplayValue("Alice");

    // Open the password change section
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));
    expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();

    // Find all our password inputs
    const current = container.querySelector('input[name="currentPassword"]');
    const next = container.querySelector('input[name="newPassword"]');
    const confirm = container.querySelector('input[name="confirmPassword"]');

    // Try to change password but enter mismatched new passwords
    await userEvent.type(current, "oldpass");
    await userEvent.type(next, "newpass1");
    await userEvent.type(confirm, "newpass2"); 

    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    // Should show error and NOT call the API
    expect(alertSpy).toHaveBeenCalledWith("New passwords do not match");
    expect(axios.put).not.toHaveBeenCalled();
  });

  // test the happy path: everything works correctly when changing a password
  test("password update success -> PUT called, alerts, closes section", async () => {
    const { alertSpy } = setupAlertsAndConfirm();

    axios.get.mockResolvedValue({
      data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
    });
    axios.put.mockResolvedValue({}); // for password endpoint

    const { container } = render(<Profile />);

    await screen.findByDisplayValue("Alice");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    const current = container.querySelector('input[name="currentPassword"]');
    const next = container.querySelector('input[name="newPassword"]');
    const confirm = container.querySelector('input[name="confirmPassword"]');

    await userEvent.type(current, "oldpass");
    await userEvent.type(next, "newpass");
    await userEvent.type(confirm, "newpass");

    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:3004/api/user/u123/password",
        { currentPassword: "oldpass", newPassword: "newpass", confirmPassword: "newpass" }
      );
    });
    expect(alertSpy).toHaveBeenCalledWith("Password updated successfully!");

    // Section is closed (heading disappears, toggle visible again)
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /change password/i })).not.toBeInTheDocument();
  });

  // Users should be able to see what they're typing when entering passwords
  test('Show Passwords checkbox toggles input types', async () => {
    // Set up our mock profile data
    axios.get.mockResolvedValue({
      data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
    });

    const { container } = render(<Profile />);
    await screen.findByDisplayValue("Alice");

    // Open the password change section
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    // Get all our password fields
    const current = container.querySelector('input[name="currentPassword"]');
    const next = container.querySelector('input[name="newPassword"]');
    const confirm = container.querySelector('input[name="confirmPassword"]');

    // By default, password fields should hide the text
    expect(current).toHaveAttribute("type", "password");
    expect(next).toHaveAttribute("type", "password");
    expect(confirm).toHaveAttribute("type", "password");

    // When the show passwords box is checked...
    await userEvent.click(screen.getByRole("checkbox", { name: /show passwords/i }));

    // All password fields should switch to showing plain text
    expect(current).toHaveAttribute("type", "text");
    expect(next).toHaveAttribute("type", "text");
    expect(confirm).toHaveAttribute("type", "text");
  });

  // For account deletion, we need to make sure:
  // 1. Users confirm their choice
  // 2. The API call succeeds
  // 3. All local data is cleaned up
  // 4. They're redirected to the home page
  test("Delete account confirms, calls DELETE, clears session, redirects to '/'", async () => {
    const { alertSpy, confirmSpy } = setupAlertsAndConfirm();

    axios.get.mockResolvedValue({
      data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
    });
    axios.delete.mockResolvedValue({});

    render(<Profile />);

    await screen.findByDisplayValue("Alice");
    await userEvent.click(screen.getByText(/delete your account/i));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith("http://localhost:3004/api/user/u123")
    );
    expect(alertSpy).toHaveBeenCalledWith("Account deleted successfully.");
    expect(sessionStorage.getItem("userId")).toBeNull();

    // JSDOM normalizes to absolute URL; assert pathname
    expect(new URL(window.location.href).pathname).toBe("/");
  });

    // Users should be able to cancel out of the profile edit view
    // This is especially important when the profile is shown in a modal
    // or as part of a larger flow
    test("Cancel button calls onCancel", async () => {
      // Set up our mock profile data
      axios.get.mockResolvedValue({
        data: { username: "Alice", email: "alice@example.com", dob: "2000-01-01" },
      });
      // Create a spy function to track when cancel is clicked
      const onCancel = jest.fn();

      // Render the profile with our cancel handler
      render(<Profile onCancel={onCancel} />);
      await screen.findByDisplayValue("Alice");

      // Click the cancel button and verify our handler was called
      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalled();
    });

});
