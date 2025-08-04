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

        if (data && data.userId) {
          sessionStorage.setItem("userId", data.userId);
          sessionStorage.setItem("token", data.token);
          console.log("User ID set in sessionStorage:", data.userId);
          console.log("Token set in sessionStorage:", data.token);
        } else {
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
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
