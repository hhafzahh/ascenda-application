import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.includes("@")) {
      errors.email = "Please enter a valid email";
    }
    if (formData.password.length < 1) {
      errors.password = "Password is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3004/api/user/login",
        formData
      );
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

        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => navigate("/register");

  return (
    <div className="login-backdrop">
      <div className="login-container">
        <h1 className="login-title">Log In</h1>
        <p className="login-subtitle">
          You can sign in using your Ascenda account to access our services.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <label className="login-label">Email Address</label>
          <input
            type="email"
            name="email"
            className="login-input"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {validationErrors.email && (
            <div className="error-message">{validationErrors.email}</div>
          )}

          <label className="login-label">Password</label>
          <input
            type="password"
            name="password"
            className="login-input"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {validationErrors.password && (
            <div className="error-message">{validationErrors.password}</div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </button>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <span onClick={handleRegisterClick} className="login-link">
                Sign up
              </span>
            </p>
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google Sign-In"
              className="google-icon"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
