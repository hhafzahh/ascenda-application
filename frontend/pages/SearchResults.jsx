import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HotelCard from "../src/components/HotelCard";
import SearchBar from "../usage/searchBar";
import FacilitiesFilter from "../src/components/FacilitiesFilter";
import StarRatingFilter from "../src/components/StarRatingFilter";
import SortControl from "../src/components/SortControl";
import HotelMap from "../components/HotelMap"; // ✅ for displaying hotels on map

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

  const [selectedFacilities, setSelectedFacilities] = useState([]); // State to store selected amenities
  const [selectedStars, setSelectedStars] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(false); // ✅ for toggling map

  const resultsPerPage = 10;

  //Sort & Filter Hotels based on rating, price and amenities
  const filteredHotels = hotels
    .filter(
      (hotel) =>
        selectedStars.length === 0 ||
        selectedStars.includes(hotel.rating?.toString())
    )
    .sort((a, b) => {
      if (sortBy === "rating") {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      }
      if (sortBy === "priceLowToHigh") {
        const priceA = a.price ?? 0;
        const priceB = b.price ?? 0;
        return priceA - priceB;
      }
      if (sortBy === "priceHighToLow") {
        const priceA = a.price ?? 0;
        const priceB = b.price ?? 0;
        return priceB - priceA;
      }
      return 0;
    })
    .filter(
      (hotel) =>
        selectedFacilities.length === 0 ||
        selectedFacilities.every(
          (facilityKey) => hotel.amenities?.[facilityKey]
        )
    );

  //pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentHotels = filteredHotels.slice(
    indexOfFirstResult,
    indexOfLastResult
  );

  const handleFacilityChange = (event) => {
    const facility = event.target.value;
    setSelectedFacilities((prevFacilities) =>
      event.target.checked
        ? [...prevFacilities, facility]
        : prevFacilities.filter((item) => item !== facility)
    );
  };

  const handleStarSelected = (event) => {
    const star = event.target.value;
    setSelectedStars((prevStars) =>
      event.target.checked
        ? [...prevStars, star]
        : prevStars.filter((item) => item !== star)
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStars, selectedFacilities]);

  const toggleMap = () => {
    setShowMap((prev) => !prev);
  };

  return (
    <>
      <div className="landing-container">
        <div className="search-wrapper">
          <SearchBar //add guests later
            queryval={searchQuery}
            initialCheckin={checkin}
            initialCheckout={checkout}
            guests={guests}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* Sidebar */}
        <div style={{ width: "320px" }}>
          {/*Filter Panel*/}
          <FacilitiesFilter
            selectedFacilities={selectedFacilities}
            onChange={handleFacilityChange}
          />

          <StarRatingFilter
            selectedStars={selectedStars}
            onChange={handleStarSelected}
          />

          {/* ✅ Toggle Map Button */}
          <button
            onClick={toggleMap}
            style={{
              backgroundColor: "#ff5722",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              marginTop: "1.5rem",
              width: "100%",
            }}
          >
            📍 {showMap ? "Hide Map" : "See hotels on map"}
          </button>
        </div>

        {/* Main content + map */}
        <div style={{ flex: 1 }}>
          <SortControl selected={sortBy} onSelect={setSortBy} />

          <div className="search-results-container">
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
                {currentHotels.map((hotel, index) => (
                  <HotelCard key={index} hotel={hotel} />
                ))}
              </div>
            ) : (
              <p>No hotels found.</p>
            )}

            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                style={{ marginRight: "1rem" }}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of{" "}
                {Math.ceil(filteredHotels.length / resultsPerPage)}
              </span>
              <button
                disabled={indexOfLastResult >= filteredHotels.length}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                style={{ marginLeft: "1rem" }}
              >
                Next
              </button>
            </div>

            <button
              style={{ marginTop: "2rem" }}
              onClick={() => navigate("/")}
            >
              Back to landing page
            </button>

            {/* ✅ Map Section - Shown when toggled */}
            <div
              style={{
                marginTop: "2rem",
                height: showMap ? "500px" : "0px",
                transition: "height 0.3s ease",
                overflow: showMap ? "visible" : "hidden",
                borderRadius: "10px",
              }}
            >
              {showMap && <HotelMap hotels={filteredHotels} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
