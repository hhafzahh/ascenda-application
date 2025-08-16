import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import "./searchBar.css";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  queryval,
  setLoading,
  initialCheckin,
  initialCheckout,
  initialAdults = 1,
  initialChildren = 0,
  initialRooms = 1,
}) {
  const [query, setQuery] = useState(queryval || ""); // Make sure query is initialized as an empty string
  const [suggestions, setSuggestions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedUID, setSelectedUID] = useState(null);
  const metaRef = useRef({});
  const [loading, setLoadingInternal] = useState(false);

  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [rooms, setRooms] = useState(initialRooms);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3); // Add 3 days to today
    return date;
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + 1); // Set checkout to 1 day after the check-in date
    return date;
  });

  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    if (initialCheckin) setStartDate(new Date(initialCheckin));
    if (initialCheckout) setEndDate(new Date(initialCheckout));
  }, [initialCheckin, initialCheckout]);

  useEffect(() => {
    fetch("/destinations.json")
      .then((res) => res.json())
      .then((data) => setDestinations(data));
  }, []);

  ////added this so that any changes to search bar query in SearchResults page, will change
  useEffect(() => {
    // If `queryval` changes, update the query state
    setQuery(queryval || ""); //added this so that it never becomes undefined
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
    let newQuery = query;

    if (!uidToUse) {
      const fuseMatch = fuseInstance.search(query);
      console.log("Fuse matches:", fuseMatch);

      if (fuseMatch.length > 0) {
        const corrected = fuseMatch[0].item;
        uidToUse = corrected.uid;
        newQuery = corrected.term;
        setQuery(corrected.term); // Update input box text
        setSelectedUID(corrected.uid);
        setSuggestions([]);
        metaRef.current = { uid: corrected.uid };
        console.log(
          "Using corrected fuzzy match:",
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

    try {
      setLoading?.(true);
      setLoadingInternal(true);
      const guestString = Array(rooms)
        .fill(adults + children)
        .join("|");

      //call again
      const res = await axios.get(
        `http://localhost:3001/api/hotelproxy/hotels/uid/${uidToUse}`,
        {
          params: {
            checkin: startDate.toISOString().split("T")[0],
            checkout: endDate.toISOString().split("T")[0],
            guests: guestString,
          },
        }
      );

      console.log(res.data);
      const hotelsList = Array.isArray(res.data)
        ? res.data
        : res.data.hotels || [];
      //setHotels(hotelsList);
      //onHotelsFetched?.(hotelsList);

      // navigate("/results", {
      //   state: { hotels: hotelsList, searchQuery: query },
      // });

      navigate("/results", {
        state: {
          hotels: hotelsList,
          searchQuery: newQuery,
          destinationId: uidToUse,
          checkin: startDate.toISOString().split("T")[0],
          checkout: endDate.toISOString().split("T")[0],
          guests: adults + children, //rooms and recentlyview using
          adults,
          children,
          rooms,
        },
      });
      setLoading?.(false);
      setLoadingInternal(false);
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    } finally {
      setLoadingInternal(false);
    }
  };

  return (
    <div className="search-bar">
      {/* {loading && (
        <div
          className="loading-spinner"
          style={{
            marginBottom: "1rem",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.2rem",
            color: "#3a4ccf",
          }}
        >
          Loading...
        </div>
      )} */}
      <div className="search-row">
        <div className="input-group">
          <label htmlFor="destination-input">Destination</label>
          <input
            type="text"
            placeholder="Select location"
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestion-list" role="list">
              {suggestions.map((d, idx) => (
                <li
                  key={idx}
                  role="listitem"
                  onClick={() => handleSelectSuggestion(d)}
                >
                  {d.term}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="date-picker-group">
          <label htmlFor="checkout-date">Check-in</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              if (date > endDate) {
                setEndDate(date); // auto-adjust checkout to match if earlier
              }
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Check-in"
            minDate={new Date()} // today onwards only
          />
        </div>
        <div className="date-picker-group">
          <label htmlFor="checkout-date">Check-out</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => {
              if (date < startDate) {
                setEndDate(startDate); // prevent invalid selection
              } else {
                setEndDate(date);
              }
            }}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="Check-out"
            minDate={startDate} // cannot checkout before check-in
          />
        </div>

        <div className="guest-room-row">
          <div className="guest-group">
            <label htmlFor="guest-summary">Guests</label>
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
                  <button
                    onClick={() => setChildren(Math.max(0, children - 1))}
                  >
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
          </div>
          <button onClick={() => handleSearch()} disabled={loading}>
            {loading ? "Loading..." : "Search Hotels"}
          </button>
        </div>
      </div>
    </div>
  );
}
