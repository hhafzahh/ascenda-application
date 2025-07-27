import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HotelCard from "../components/HotelCard";
import SearchBar from "../components/SearchBar/searchBar";
import FacilitiesFilter from "../components/FacilitiesFilter";
import StarRatingFilter from "../components/StarRatingFilter";
import SortControl from "../components/SortControl";
import MapPreview from "../components/MapPreview";
import FullMapModal from "../components/FullMapModal";

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
  const [selectedStars, setSelectedStars] = useState([]);
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);

  const resultsPerPage = 10;

  const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude);
  const hotelsWithoutCoords = hotels.filter(h => !h.latitude || !h.longitude);

  const filteredHotelsForMap = hotelsWithCoords
    .filter(h => selectedStars.length === 0 || selectedStars.includes(String(h.rating || 0)))
    .filter(h => selectedFacilities.length === 0 || selectedFacilities.every(fac => h.amenities?.[fac]));

  const filteredHotelsForList = [...hotelsWithCoords, ...hotelsWithoutCoords]
    .filter(h => selectedStars.length === 0 || selectedStars.includes(String(h.rating || 0)))
    .filter(h => selectedFacilities.length === 0 || selectedFacilities.every(fac => h.amenities?.[fac]))
    .sort((a, b) => {
      if (sortBy === "priceLowToHigh") return (a.price || 0) - (b.price || 0);
      if (sortBy === "priceHighToLow") return (b.price || 0) - (a.price || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  const indexOfLastResult = currentPage * resultsPerPage;
  const currentHotels = filteredHotelsForList.slice(indexOfLastResult - resultsPerPage, indexOfLastResult);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFacilities, selectedStars]);

  const handleFacilityChange = (e) => {
    const value = e.target.value;
    setSelectedFacilities(prev =>
      e.target.checked ? [...prev, value] : prev.filter(f => f !== value)
    );
  };

  const handleStarSelected = (e) => {
    const value = e.target.value;
    setSelectedStars(prev =>
      e.target.checked ? [...prev, value] : prev.filter(s => s !== value)
    );
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <SearchBar
        queryval={searchQuery}
        initialCheckin={checkin}
        initialCheckout={checkout}
        guests={guests}
      />

      <div style={{ display: "flex", gap: "30px" }}>
        {/* LEFT PANEL */}
        <div style={{ width: "300px" }}>
          <FacilitiesFilter
            selectedFacilities={selectedFacilities}
            onChange={handleFacilityChange}
          />
          <StarRatingFilter
            selectedStars={selectedStars}
            onChange={handleStarSelected}
          />
          <MapPreview
            hotels={filteredHotelsForMap}
            onClickExpand={() => setShowFullMap(true)} 
          />
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1 }}>
          <SortControl selected={sortBy} onSelect={setSortBy} />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredHotelsForList.length > 0 ? (
              currentHotels.map(hotel => (
                <div
                  id={`hotel-${hotel.id}`}
                  key={hotel.id}
                  onClick={() => {
                    navigate(`/hotels/${hotel.id}`, {
                      state: {
                        hotel,
                        searchParams: { destinationId, checkin, checkout, guests },
                      },
                    });
                  }}
                >
                  <HotelCard
                    hotel={hotel}
                    isSelected={selectedHotelId === hotel.id}
                    hasLocation={!!(hotel.latitude && hotel.longitude)}
                  />
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p>No hotels found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL MAP MODAL */}
      {showFullMap && (
        <FullMapModal
          hotels={filteredHotelsForMap}
          onClose={() => setShowFullMap(false)}
          onMarkerClick={(hotelId) => {
            setSelectedHotelId(hotelId);
            const el = document.getElementById(`hotel-${hotelId}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            setShowFullMap(false); 
          }}
        />
      )}
    </div>
  );
}
