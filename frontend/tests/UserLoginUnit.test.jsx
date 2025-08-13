// tests/UserLoginUnit.test.jsx
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import Login from "../src/pages/Login";

// Mock axios
jest.mock("axios", () => ({ post: jest.fn() }));
import axios from "axios";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Spy sessionStorage
const setItemSpy = jest.spyOn(window.sessionStorage.__proto__, "setItem");

beforeEach(() => {
  jest.clearAllMocks();
});

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>
  );

const getInputs = (container) => {
  const emailInput = container.querySelector('input[type="email"]');
  const passwordInput = container.querySelector('input[type="password"]');
  return { emailInput, passwordInput };
};

test("shows validation error when empty", async () => {
  const { container } = renderLogin();

  // submit the form directly (bypasses native required short-circuit)
  const form = container.querySelector("form");
  fireEvent.submit(form);

  expect(
    await screen.findByText(/email and password are required/i)
  ).toBeInTheDocument();
});

test("successful login stores token/userId and navigates home", async () => {
  axios.post.mockResolvedValueOnce({
    status: 200,
    data: { userId: "U123", token: "TKN" },
  });

  const { container } = renderLogin();
  const { emailInput, passwordInput } = getInputs(container);

  fireEvent.change(emailInput, { target: { value: "a@b.com" } });
  fireEvent.change(passwordInput, { target: { value: "pw" } });

  fireEvent.submit(container.querySelector("form"));

  await waitFor(() => {
    expect(setItemSpy).toHaveBeenCalledWith("userId", "U123");
    expect(setItemSpy).toHaveBeenCalledWith("token", "TKN");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("non-200 response shows backend error", async () => {
  axios.post.mockResolvedValueOnce({
    status: 401,
    data: { error: "Bad creds" },
  });

  const { container } = renderLogin();
  const { emailInput, passwordInput } = getInputs(container);

  fireEvent.change(emailInput, { target: { value: "a@b.com" } });
  fireEvent.change(passwordInput, { target: { value: "pw" } });

  fireEvent.submit(container.querySelector("form"));

  expect(await screen.findByText(/bad creds/i)).toBeInTheDocument();
});

test("request failure shows generic error", async () => {
  axios.post.mockRejectedValueOnce(new Error("network"));

  const { container } = renderLogin();
  const { emailInput, passwordInput } = getInputs(container);

  fireEvent.change(emailInput, { target: { value: "a@b.com" } });
  fireEvent.change(passwordInput, { target: { value: "pw" } });

  fireEvent.submit(container.querySelector("form"));

  expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
});