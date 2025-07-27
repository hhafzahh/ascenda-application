import React from "react";
import "./BackgroundHeader.css";
import heroImage from "./image-13.jpg"; // replace with your actual image path

export default function BackgroundHeader({ children }) {
  return (
    <div className="hero-wrapper">
      <img src={heroImage} alt="Hero background" className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">The Ultimate Hotel Experience</div>
        <h1 className="hero-title">
          Discover Your Perfect
          <br />
          Gateway Destination
        </h1>
        <p className="hero-subtitle">
          Unparalleled luxury and comfort await at the world's most exclusive
          hotels and resorts. Start your journey today.
        </p>
        {children}
      </div>
    </div>
  );
}
