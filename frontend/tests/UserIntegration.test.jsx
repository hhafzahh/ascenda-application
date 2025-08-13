import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Login from "../src/pages/Login/Login";
import Registration from "../src/pages/Register/Register";
import ProtectedRoute from "../src/ProtectedRoute";
import Landing from "../src/pages/Landing";
import Profile from "../src/pages/Profile";


// mock axios
jest.mock("axios", () => ({ post: jest.fn(), get: jest.fn() }));

function renderAppAt(initialPath = "/") {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registration />} />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Landing />} />
            </Routes>
        </MemoryRouter>
    );
}

// mock fetch used by SearchBar
beforeAll(() => {
    global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve([]),
    });
});
afterAll(() => { delete global.fetch; });

beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
});


// 1) Register -> success -> redirect to /login (needs timers)
test("Register success (201) shows message then navigates to /login", async () => {
    jest.useFakeTimers(); // timers for the 2s redirect

    axios.post.mockResolvedValueOnce({ status: 201, data: { message: "ok", userId: "U1" } });
    renderAppAt("/register");

    fireEvent.change(screen.getByPlaceholderText(/enter your full name/i), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "2000-01-01" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your email address/i), { target: { value: "ada@math.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();

    // advance the 2s timeout that triggers navigate("/login")
    await act(async () => { jest.advanceTimersByTime(2000); });

    await waitFor(() => {
        // Your Login page h1 is "Log In"
        expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    });

    jest.useRealTimers();
});

// 2) Login -> success -> token saved -> redirect to Home -> /profile allowed
test("Login success stores token/userId then ProtectedRoute allows access", async () => {
    jest.useFakeTimers(); // because Login also uses a 2s navigate

    axios.post.mockResolvedValueOnce({ status: 200, data: { userId: "U123", token: "TKN" } });
    renderAppAt("/login");

    fireEvent.change(screen.getByPlaceholderText(/Enter your email address/i), {
        target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
        target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // sessionStorage updates happen immediately on success
    await waitFor(() => {
        expect(sessionStorage.getItem("token")).toBe("TKN");
        expect(sessionStorage.getItem("userId")).toBe("U123");
    });

    // now advance the 2s timeout to allow navigate("/") to happen
    await act(async () => { jest.advanceTimersByTime(2000); });

    axios.get.mockResolvedValueOnce({
        data: { username: "Ada", email: "ada@math.com", dob: "2000-01-01" },
    });

    // we should be on landing
    expect(
        await screen.findByRole("heading", { name: /recently viewed hotels for you/i, level: 2 })
    ).toBeInTheDocument();
    // and ProtectedRoute should let us into /profile since token is present
    renderAppAt("/profile");
    expect(await screen.findByText(/Account Settings/i)).toBeInTheDocument();

    jest.useRealTimers();
});