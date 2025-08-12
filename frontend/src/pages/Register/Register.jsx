import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.email.includes("@")) errors.email = "Please enter a valid email";
    if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const registrationData = {
        username: formData.fullName,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
      };
      const res = await axios.post("http://localhost:3004/api/user/register", registrationData);
      if (res.status === 201) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => navigate("/login");

  return (
    <div className="register-backdrop">
      <div className="register-container">
        <h1 className="register-title">Sign Up</h1>
        <p className="register-subtitle">
          You can sign up for an Ascenda account to access our services.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label className="register-label" htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            name="fullName"
            className="register-input"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          {validationErrors.fullName && <div className="error-message">{validationErrors.fullName}</div>}

          <label className="register-label" htmlFor="dateOfBirth">Date of Birth</label>
          <input
            id="dateOfBirth"
            type="date"
            name="dateOfBirth"
            className="register-input"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
          {validationErrors.dateOfBirth && <div className="error-message">{validationErrors.dateOfBirth}</div>}

          <label className="register-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            className="register-input"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {validationErrors.email && <div className="error-message">{validationErrors.email}</div>}

          <label className="register-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            className="register-input"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {validationErrors.password && <div className="error-message">{validationErrors.password}</div>}

          <div className="register-remember">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="rememberMe">Remember me?</label>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <span onClick={handleLoginClick} className="register-link">
                Log In
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
