// /frontend/pages/Landing.jsx
import React, { useState } from "react";
import SearchBar from "../components/SearchBar/searchBar";
import BackgroundHeader from "../components/BackgroundHeader/BackgroundHeader";
import "../App.css";

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="search-wrapper">
        <BackgroundHeader>
          <SearchBar />
        </BackgroundHeader>
      </div>
    </div>
  );
}
