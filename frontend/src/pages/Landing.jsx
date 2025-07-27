import React from "react";
import SearchBar from "../components/SearchBar/searchBar";
import SuggestedHotels from "../components/SuggestedHotels";
import "../components/SuggestedHotels.css";

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="search-wrapper">
        <SearchBar />
      </div>

      <h2 style={{ textAlign: "center", margin: "2rem 0" }}>
        Suggested Hotels for You
      </h2>
      <SuggestedHotels />
    </div>
  );
}
