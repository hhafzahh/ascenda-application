import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import "./SearchBar.css";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ queryval, setLoading }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedUID, setSelectedUID] = useState(null);
  const metaRef = useRef({});

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    fetch("/destinations.json")
      .then((res) => res.json())
      .then((data) => setDestinations(data));
  }, []);

  ////added this so that any changes to search bar query in SearchResults page, will change
  useEffect(() => {
    // If `queryval` changes, update the query state
    setQuery(queryval);
  }, [queryval]);

  const navigate = useNavigate();

  const fuseInstance = useMemo(() => {
    return new Fuse(destinations, {
      keys: [
        { name: "term", weight: 0.9 },
        { name: "city", weight: 0.05 },
        { name: "state", weight: 0.05 },
      ],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, [destinations]);

  const debouncedSuggest = useRef(
    debounce((input, fuse) => {
      if (input.length > 1 && fuse) {
        const results = fuse.search(input).map((r) => r.item);
        setSuggestions(results.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    }, 200)
  ).current;

  const handleInputChange = (e) => {
    const input = e.target.value;
    setQuery(input);
    setSelectedUID(null);
    metaRef.current = {};
    debouncedSuggest(input, fuseInstance);
  };

  const handleSelectSuggestion = (destination) => {
    setQuery(destination.term);
    setSelectedUID(destination.uid);
    setSuggestions([]);
    metaRef.current = { uid: destination.uid };
  };
  const handleSearch = async (meta = {}) => {
    console.log("handleSearch triggered", {
      query,
      metaRef: metaRef.current,
      selectedUID,
    });

    if (!query) {
      alert("Please enter a destination.");
      return;
    }

    let uidToUse = meta.uid || metaRef.current.uid || selectedUID;

    if (!uidToUse) {
      const fuseMatch = fuseInstance.search(query);
      console.log("Fuse matches:", fuseMatch);

      if (fuseMatch.length > 0) {
        const corrected = fuseMatch[0].item;
        uidToUse = corrected.uid;
        handleSelectSuggestion(corrected);
        console.log(
          "✅ Using corrected fuzzy match:",
          corrected.term,
          "→",
          uidToUse
        );
      } else {
        alert("Destination not recognized. Please try again.");
        return;
      }
    }

    setSuggestions([]); // Hide suggestions after submit

    setLoading?.(true);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/hotelproxy/hotels/uid/${uidToUse}`
      );
      const hotelsList = Array.isArray(res.data)
        ? res.data
        : res.data.hotels || [];
      //setHotels(hotelsList);
      //onHotelsFetched?.(hotelsList);

      navigate("/results", {
        state: { hotels: hotelsList, searchQuery: query },
      });

      navigate;
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="search-bar">
      <div className="search-row">
        <div className="input-group">
          <input
            type="text"
            placeholder="Select location"
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestion-list">
              {suggestions.map((d, idx) => (
                <li key={idx} onClick={() => handleSelectSuggestion(d)}>
                  {d.term}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Check-in"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          placeholderText="Check-out"
          minDate={startDate}
        />

        <div className="guest-room-row">
          <div className="dropdown-toggle">
            {`${adults} adult(s) · ${children} child(ren) · ${rooms} room(s)`}

            <div className="dropdown-content">
              <div className="counter">
                <label>Adults</label>
                <button onClick={() => setAdults(Math.max(1, adults - 1))}>
                  −
                </button>
                <span>{adults}</span>
                <button onClick={() => setAdults(adults + 1)}>+</button>
              </div>

              <div className="counter">
                <label>Children</label>
                <button onClick={() => setChildren(Math.max(0, children - 1))}>
                  −
                </button>
                <span>{children}</span>
                <button onClick={() => setChildren(children + 1)}>+</button>
              </div>

              <div className="counter">
                <label>Rooms</label>
                <button onClick={() => setRooms(Math.max(1, rooms - 1))}>
                  −
                </button>
                <span>{rooms}</span>
                <button onClick={() => setRooms(rooms + 1)}>+</button>
              </div>
            </div>
          </div>
          <button onClick={() => handleSearch()}>Search Hotels</button>
        </div>
      </div>
    </div>
  );
}
