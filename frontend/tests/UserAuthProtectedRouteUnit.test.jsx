import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "../src/ProtectedRoute";

function Login() { return <div>LOGIN PAGE</div>; }
function Secret() { return <div>SECRET</div>; }

const renderWithPath = () =>
  render(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <Secret />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => sessionStorage.clear());

test("redirects to /login when no token", () => {
  renderWithPath();
  expect(screen.getByText(/login page/i)).toBeInTheDocument();
});

test("renders children when token exists", () => {
  sessionStorage.setItem("token", "TKN");
  renderWithPath();
  expect(screen.getByText(/secret/i)).toBeInTheDocument();
});