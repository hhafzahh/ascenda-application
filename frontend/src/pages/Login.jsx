import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import axios from "axios";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3004/api/user/login", {
        email,
        password,
      });
      const data = res.data;
      console.log("Login response:", res.data);
      if (res.status !== 200) {
        setError(data.error || "Login failed");
      } else {
        setSuccess("Login successful");
        // Always set token if present
        if (data && data.token) {
          sessionStorage.setItem("token", data.token);
          console.log("Token set in sessionStorage:", data.token);
        }
        if (data && data.userId) {
          sessionStorage.setItem("userId", data.userId);
          console.log("User ID set in sessionStorage:", data.userId);
        } else if (data && data.token) {
          console.warn("User ID not found in response:", data);
        }
        window.dispatchEvent(new Event("custom-login-event"));
        navigate("/");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
