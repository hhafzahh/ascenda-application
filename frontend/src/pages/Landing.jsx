import React from "react";
import SearchBar from "../components/SearchBar/searchBar";
import RecentlyViewedHotels from "../components/RecentlyViewedHotels";
import "../components/RecentlyViewedHotels.css";
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

      <h2
        style={{ textAlign: "center", margin: "2rem 0" }}
        data-testid="recently-viewed-title"
      >
        Recently Viewed Hotels for You
      </h2>

      <RecentlyViewedHotels />
    </div>
  );
}
