import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HotelCard from "../src/components/HotelCard";
import SearchBar from "../usage/searchBar";
import FacilitiesFilter from "../src/components/FacilitiesFilter";
import StarRatingFilter from "../src/components/StarRatingFilter";
import SortByControl from "../src/components/SortControl";
import SortControl from "../src/components/SortControl";
import axios from "axios";

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
  const [hotelPrices, setHotelPrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(false); //added loading behavior since its takes some time to load prices

  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  const filteredHotels = hotels.filter(
    (hotel) =>
      selectedStars.length === 0 ||
      selectedStars.includes(hotel.rating.toString())
  );

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentHotels = filteredHotels.slice(
    indexOfFirstResult,
    indexOfLastResult
  );

  useEffect(() => {
    //loads the page but removes caches data //causes previous page cache to be cleared
    setHotelPrices({});
  }, [currentPage]);

  useEffect(() => {
    async function fetchPricesForCurrentPage() {
      if (!currentHotels || currentHotels.length === 0) return;

      if (!destinationId || !checkin || !checkout) return;
      setPriceLoading(true);
      const checkinStr = new Date(checkin).toISOString().split("T")[0];
      const checkoutStr = new Date(checkout).toISOString().split("T")[0];

      const hotelsToFetch = currentHotels.filter(
        (hotel) => !(hotel.id in hotelPrices)
      );
      if (hotelsToFetch.length === 0) {
        setPriceLoading(false);
        return;
      }

      const prices = await Promise.all(
        hotelsToFetch.map(async (hotel) => {
          try {
            const res = await axios.get(
              "http://localhost:3001/api/hotelproxy/rooms",
              {
                params: {
                  hotel_id: hotel.id,
                  destination_id: destinationId,
                  checkin: checkinStr,
                  checkout: checkoutStr,
                  lang: "en_US",
                  currency: "SGD",
                  country_code: "SG",
                  guests: guests || "2",
                  partner_id: 1,
                },
              }
            );
            const data = res.data;
            console.log(hotel.id, checkinStr, checkoutStr);
            console.log(res.data);
            //gets the minimum price from the room array
            if (Array.isArray(data.rooms) && data.rooms.length > 0) {
              const prices = data.rooms
                .map((room) => room.price)
                .filter((price) => typeof price === "number");

              const minPrice = prices.length > 0 ? Math.min(...prices) : null;

              console.log(`Min price for hotel ${hotel.id}:`, minPrice);
              return [hotel.id, minPrice];
            }
          } catch (err) {
            console.error(`Failed to fetch price for hotel ${hotel.id}:`, err);
          }
          return [hotel.id, null];
        })
      );

      setHotelPrices((prev) => ({
        ...prev,
        ...Object.fromEntries(prices),
      }));
      //setPriceLoading(false);
    }

    fetchPricesForCurrentPage();
  }, [currentHotels]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStars, selectedFacilities]);

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
                {console.log(hotelPrices)}
                {currentHotels.map((hotel, index) => {
                  const price = hotelPrices[hotel.id];

                  return (
                    <HotelCard
                      key={index}
                      hotel={hotel}
                      price={
                        priceLoading
                          ? "Loading price..."
                          : price != null
                          ? `${price}`
                          : "Price unavailable"
                      }
                    />
                  );
                })}
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
              Back to search
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
