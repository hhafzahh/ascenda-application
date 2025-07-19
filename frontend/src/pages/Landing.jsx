// /frontend/pages/Landing.jsx
import React, { useState } from "react";
import SearchBar from "../components/SearchBar/searchBar";

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="search-wrapper">
        <SearchBar />
      </div>
    </div>
  );
}
