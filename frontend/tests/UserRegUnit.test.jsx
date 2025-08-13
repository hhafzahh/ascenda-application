import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Registration from "../src/pages/Register/Register";
import axios from "axios";

jest.mock("axios");
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const real = jest.requireActual("react-router-dom");
  return { ...real, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});

test("shows validation errors for missing/invalid fields", async () => {
  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
  expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  expect(screen.getByText(/password must be at least 6/i)).toBeInTheDocument();
});

test("successful registration shows message and navigates to /login", async () => {
  axios.post.mockResolvedValueOnce({ status: 201, data: { message: "ok" } });
  jest.useFakeTimers();

  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText(/enter your full name/i), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), { target: { value: "ada@math.com" } });
  fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "secret123" } });

  fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
  expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();

  jest.advanceTimersByTime(2000);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));

  jest.useRealTimers();
});

test("backend error message is shown", async () => {
  axios.post.mockRejectedValueOnce({ response: { data: { error: "Email already exists" } } });

  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText(/enter your full name/i), { target: { value: "Ada" } });
  fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), { target: { value: "ada@math.com" } });
  fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "secret123" } });

  fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

  expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
});