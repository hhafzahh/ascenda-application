import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HotelCard from "../components/HotelCard";
import SearchBar from "../components/SearchBar/searchBar";
import FacilitiesFilter from "../components/FacilitiesFilter";
import StarRatingFilter from "../components/StarRatingFilter";
import SortControl from "../components/SortControl";
import MapPreview from "../components/MapPreview";
import FullMapModal from "../components/FullMapModal";
import RatingSlider from "../components/RatingSlider";
import PriceRangeFilter from "../components/PriceRangeFilter";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    hotels = [],
    searchQuery,
    destinationId,
    checkin,
    checkout,
    guests,
  } = location.state || {};

  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [minGuestRating, setMinGuestRating] = useState(0);
  const [selectedStars, setSelectedStars] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const resultsPerPage = 10;
  const [priceRange, setPriceRange] = useState([0, 12000]);

  // Separate hotels with and without coordinates
  const [hotelsWithCoords, hotelsWithoutCoords] = hotels.reduce(
    ([withCoords, withoutCoords], hotel) => {
      if (hotel.latitude && hotel.longitude) {
        return [[...withCoords, hotel], withoutCoords];
      } else {
        return [withCoords, [...withoutCoords, hotel]];
      }
    },
    [[], []]
  );

  // Apply filters only to hotels with coordinates for the map
  const filteredHotelsForMap = hotelsWithCoords
    .filter(
      (hotel) =>
        selectedStars.length === 0 ||
        selectedStars.includes(String(hotel.rating || 0))
    )
    .filter(
      (hotel) =>
        selectedFacilities.length === 0 ||
        selectedFacilities.every(
          (facilityKey) => hotel.amenities?.[facilityKey]
        )
    );

  // Apply filters to ALL hotels for the list view
  const filteredHotelsForList = [...hotelsWithCoords, ...hotelsWithoutCoords]
    .filter(
      (hotel) =>
        selectedStars.length === 0 ||
        selectedStars.includes(String(hotel.rating || 0))
    )
    .sort((a, b) => {
      if (sortBy === "priceLowToHigh") return (a.price || 0) - (b.price || 0);
      if (sortBy === "priceHighToLow") return (b.price || 0) - (a.price || 0);
      return (b.rating || 0) - (a.rating || 0);
    })
    .filter(
      (hotel) =>
        selectedFacilities.length === 0 ||
        selectedFacilities.every(
          (facilityKey) => hotel.amenities?.[facilityKey]
        )
    )
    .filter(
      (hotel) => hotel.price >= priceRange[0] && hotel.price <= priceRange[1]
    );

  //pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const currentHotels = filteredHotelsForList.slice(
    indexOfLastResult - resultsPerPage,
    indexOfLastResult
  );

  //all works, its passed properly
  /*
  console.log("Hotels:", hotels);
  console.log("Search Query:", searchQuery);
  console.log("Destination ID:", destinationId);
  console.log("Check-in Date:", checkin.toISOString().split("T", 1)[0]);
  console.log("Check-out Date:", checkout);
  console.log("Guests:", guests);*/

  useEffect(() => setCurrentPage(1), [selectedStars, selectedFacilities]);

  //handles selecting amenities checkbox and rating checkbox
  const handleFacilityChange = (event) => {
    const facility = event.target.value;
    //console.log(facility)
    setSelectedFacilities(
      (prevFacilities) =>
        event.target.checked
          ? [...prevFacilities, facility] // Add to selected amenities
          : prevFacilities.filter((item) => item !== facility) // Remove from selected amenities
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

  const currentHotelsWithCoords = currentHotels.filter(
    (hotel) =>
      typeof hotel.latitude === "number" && typeof hotel.longitude === "number"
  );

  const handlePriceChange = (range) => {
    setPriceRange(range);
    // Apply filter logic here, or update search params/state
    console.log("New price range:", range);
  };
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      {/* Search Bar */}
      <div data-testid="search-bar" style={{ marginBottom: "20px" }}>
        <SearchBar
          queryval={searchQuery}
          initialCheckin={checkin}
          initialCheckout={checkout}
          guests={guests}
        />
      </div>

      <div style={{ display: "flex", gap: "30px" }}>
        {/* Left Sidebar */}
        <div style={{ width: "300px" }}>
          <FacilitiesFilter
            selectedFacilities={selectedFacilities}
            onChange={handleFacilityChange}
          />

          <StarRatingFilter
            selectedStars={selectedStars}
            onChange={handleStarSelected}
          />

          <RatingSlider value={minGuestRating} onChange={setMinGuestRating} />

          {/* Use MapPreview component */}

          <MapPreview
            hotels={currentHotelsWithCoords}
            onClickExpand={() => setShowFullMap(true)}
          />
          <PriceRangeFilter value={priceRange} onChange={handlePriceChange} />
        </div>

        {/* Right Content - Hotel List */}
        <div style={{ flex: 1 }}>
          <SortControl selected={sortBy} onSelect={setSortBy} />

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {filteredHotelsForList.length > 0 ? (
              <>
                {currentHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    onClick={() => {
                      console.log("Passing searchParams:", {
                        destinationId,
                        checkin,
                        checkout,
                        guests,
                      });
                      console.log("Navigating with hotel:", hotel); // Debug
                      navigate(`/hotels/${hotel.id}`, {
                        state: {
                          hotel: hotel, // Pass the entire hotel object
                          searchParams: {
                            destinationId,
                            checkin,
                            checkout,
                            guests,
                          },
                        },
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <HotelCard
                      data-testid="hotel-card"
                      id={`hotel-${hotel.id}`}
                      hotel={hotel}
                      isSelected={selectedHotelId === hotel.id}
                      hasLocation={!!(hotel.latitude && hotel.longitude)}
                      searchParams={{
                        destinationId,
                        checkin,
                        checkout,
                        guests,
                      }}
                    />
                  </div>
                ))}

                {filteredHotelsForList.length > resultsPerPage && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "20px",
                      margin: "30px 0",
                    }}
                  >
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      style={{
                        padding: "8px 16px",
                        background: currentPage === 1 ? "#f0f0f0" : "#0071c2",
                        color: currentPage === 1 ? "#999" : "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of{" "}
                      {Math.ceil(filteredHotelsForList.length / resultsPerPage)}
                    </span>
                    <button
                      disabled={
                        currentPage >=
                        Math.ceil(filteredHotelsForList.length / resultsPerPage)
                      }
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      style={{
                        padding: "8px 16px",
                        background:
                          currentPage >=
                          Math.ceil(
                            filteredHotelsForList.length / resultsPerPage
                          )
                            ? "#f0f0f0"
                            : "#0071c2",
                        color:
                          currentPage >=
                          Math.ceil(
                            filteredHotelsForList.length / resultsPerPage
                          )
                            ? "#999"
                            : "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          currentPage >=
                          Math.ceil(
                            filteredHotelsForList.length / resultsPerPage
                          )
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p>No hotels found matching your criteria.</p>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    padding: "10px 20px",
                    background: "#0071c2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                >
                  Try a new search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Map Modal  */}
      {showFullMap && (
        <FullMapModal
          hotels={filteredHotelsForMap}
          onClose={() => setShowFullMap(false)}
          onMarkerClick={(hotelId) => {
            setSelectedHotelId(hotelId);
            const element = document.getElementById(`hotel-${hotelId}`);
            if (element)
              element.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            setShowFullMap(false);
          }}
        />
      )}
    </div>
  );
}
