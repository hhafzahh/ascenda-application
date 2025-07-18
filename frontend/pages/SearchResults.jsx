import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HotelCard from "../src/components/HotelCard";
import SearchBar from "../usage/searchBar";
import FacilitiesFilter from "../src/components/FacilitiesFilter";
import StarRatingFilter from "../src/components/StarRatingFilter";
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

  const [selectedFacilities, setSelectedFacilities] = useState([]); // State to store selected amenities
  const [selectedStars, setSelectedStars] = useState([]);
  const [sortBy, setSortBy] = useState("rating");

  const [currentPage, setCurrentPage] = useState(1);
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
        //console.log(a.rating); //possible that some values are undefined
        const ratingA = a.rating ?? 0; // fallback to 0 if undefined
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

  const handleFacilityChange = (event) => {
    const facility = event.target.value;

    setSelectedFacilities(
      (prevFacilities) =>
        event.target.checked
          ? [...prevFacilities, facility] // Add to selected facilities
          : prevFacilities.filter((item) => item !== facility) // Remove from selected facilities
    );
  };

  const handleStarSelected = (event) => {
    const star = event.target.value;

    setSelectedStars(
      (prevStars) =>
        event.target.checked
          ? [...prevStars, star] // Add to selected stars
          : prevStars.filter((item) => item !== star) // Remove from selected stars
    );
  };

  //pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentHotels = filteredHotels.slice(
    indexOfFirstResult,
    indexOfLastResult
  );

  // const test = hotels.filter((hotel) => {
  //   if (selectedFacilities.length === 0) return true;
  //   return selectedFacilities.every(
  //     (facilityKey) => hotel.amenities?.[facilityKey]
  //   );
  // });
  // console.log(test);

  //all works, its passed properly
  /*
  console.log("Hotels:", hotels);
  console.log("Search Query:", searchQuery);
  console.log("Destination ID:", destinationId);
  console.log("Check-in Date:", checkin.toISOString().split("T", 1)[0]);
  console.log("Check-out Date:", checkout);
  console.log("Guests:", guests);*/

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStars, selectedFacilities]);

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
                {currentHotels.map((hotel, index) => (
                  <HotelCard key={index} hotel={hotel} /> //changed to component for easier styling
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

            <button style={{ marginTop: "2rem" }} onClick={() => navigate("/")}>
              Back to landing page
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
