import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HotelCard from "../src/components/HotelCard";
import SearchBar from "../usage/searchBar";
import FacilitiesFilter from "../src/components/FacilitiesFilter";
import StarRatingFilter from "../src/components/StarRatingFilter";
import SortByControl from "../src/components/SortControl";
import SortControl from "../src/components/SortControl";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  //const { hotels = [], searchQuery } = location.state || {};
  const {
    hotels = [],
    searchQuery,
    destinationId,
    checkin,
    checkout,
    guests,
  } = location.state || {};

  const [selectedFacilities, setSelectedFacilities] = useState([]); // State to store selected facilities
  const [selectedStars, setSelectedStars] = useState([]);
  const [sortBy, setSortBy] = useState("rating");

  const handleFacilityChange = (event) => {
    const facility = event.target.value;

    setSelectedFacilities(
      (prevFacilities) =>
        event.target.checked
          ? [...prevFacilities, facility] // Add to selected facilities
          : prevFacilities.filter((item) => item !== facility) // Remove from selected facilities
    );
  };

  //all works, its passed properly
  /*
  console.log("Hotels:", hotels);
  console.log("Search Query:", searchQuery);
  console.log("Destination ID:", destinationId);
  console.log("Check-in Date:", checkin.toISOString().split("T", 1)[0]);
  console.log("Check-out Date:", checkout);
  console.log("Guests:", guests);*/

  const handleStarSelected = (event) => {
    const star = event.target.value;

    setSelectedStars(
      (prevStars) =>
        event.target.checked
          ? [...prevStars, star] // Add to selected facilities
          : prevStars.filter((item) => item !== star) // Remove from selected facilities
    );
  };

  const filteredHotels = hotels.filter(
    (hotel) =>
      selectedStars.length === 0 ||
      selectedStars.includes(hotel.rating.toString())
  );

  return (
    <>
      <div className="landing-container">
        <div className="search-wrapper">
          <SearchBar queryval={searchQuery} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Sidebar */}
        <div>
          {/* Map Button */}
          <div style={{ marginTop: "1rem", gap: "2rem" }}></div>
          {/*Filter Panel*/}
          <FacilitiesFilter
            selectedFacilities={selectedFacilities}
            onChange={handleFacilityChange}
          />

          <StarRatingFilter
            selectedStars={selectedStars}
            onChange={handleStarSelected}
          />
        </div>

        {/* Main content: Hotel list */}
        <div style={{ flex: 1 }}>
          {/*  hotel list rendering */}
          <SortControl selected={sortBy} onSelect={setSortBy} />

          <div className="search-results-container">
            {/* <h2>Results for: {searchQuery}</h2> //testing */}

            {filteredHotels.length > 0 ? (
              <div
                className="hotel-card-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  marginTop: "1rem",
                }}
              >
                {filteredHotels.map((hotel, index) => (
                  <HotelCard key={index} hotel={hotel} /> //changed to component for easier styling
                ))}
              </div>
            ) : (
              <p>No hotels found.</p>
            )}

            <button style={{ marginTop: "2rem" }} onClick={() => navigate("/")}>
              Back to search
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
