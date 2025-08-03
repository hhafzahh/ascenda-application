import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AppBar,
  Box,
  Button,
  Paper,
  Stack,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChildCareIcon from "@mui/icons-material/ChildCare"
import HotelIcon from "@mui/icons-material/Hotel";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import "./SearchBar.css";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  queryval,
  setLoading,
  initialCheckin,
  initialCheckout,
  guests, // Add guests prop
}) {
  const [query, setQuery] = useState(""); // Initialize empty, will be set by useEffect
  const [suggestions, setSuggestions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedUID, setSelectedUID] = useState(null);
  const metaRef = useRef({});
  const [loading, setLoadingInternal] = useState(false);
  const [loadingInternal, setInternalLoading] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [hotels, setHotels] = useState([]);

  // Initialize dates from props
  useEffect(() => {
    if (initialCheckin) setStartDate(new Date(initialCheckin));
    if (initialCheckout) setEndDate(new Date(initialCheckout));
  }, [initialCheckin, initialCheckout]);

  // Initialize guests from props
  useEffect(() => {
    if (guests && typeof guests === 'number') {
      setAdults(Math.max(1, guests));
    }
  }, [guests]);

  // Load destinations
  useEffect(() => {
    fetch("/destinations.json")
      .then((res) => res.json())
      .then((data) => setDestinations(data))
      .catch(err => console.error("Failed to load destinations:", err));
  }, []);

  // Initialize and update query from queryval prop
  useEffect(() => {
    console.log("SearchBar queryval changed:", queryval);
    if (queryval && queryval !== query) {
      setQuery(queryval);
      
      // If we have destinations loaded, try to find the matching UID
      if (destinations.length > 0) {
        const matchingDestination = destinations.find(dest => 
          dest.term.toLowerCase() === queryval.toLowerCase()
        );
        if (matchingDestination) {
          setSelectedUID(matchingDestination.uid);
          metaRef.current = { uid: matchingDestination.uid };
          console.log("Found matching destination:", matchingDestination);
        }
      }
    }
  }, [queryval, destinations]);

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
        setQuery(corrected.term);
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

    setSuggestions([]);

    // Always navigate to results page, even if API fails
    const navigationData = {
      hotels: [], // Default to empty array
      searchQuery: query,
      destinationId: uidToUse,
      checkin: startDate,
      checkout: endDate,
      guests: adults + children,
      error: null, // Will be set if API fails
    };

    try {
      setLoading?.(true);
      setInternalLoading(true);
      const guestString = Array(rooms)
        .fill(adults + children)
        .join("|");

      console.log("Making API call with:", {
        uid: uidToUse,
        checkin: startDate.toISOString().split("T")[0],
        checkout: endDate.toISOString().split("T")[0],
        guests: guestString,
      });

      // Wake up API call
      await axios.get(
        `http://localhost:3001/api/hotelproxy/hotels/uid/${uidToUse}`,
        {
          params: {
            checkin: startDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
            checkout: endDate.toISOString().split("T")[0],   // Convert to YYYY-MM-DD
            guests: String(adults + children),               // Convert to string
          },
        }
      );

      // Main API call
      const res = await axios.get(
        `http://localhost:3001/api/hotelproxy/hotels/uid/${uidToUse}`,
        {
          params: {
            checkin: startDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
            checkout: endDate.toISOString().split("T")[0],   // Convert to YYYY-MM-DD
            guests: String(adults + children),               // Convert to string
          },
        }
      );

      console.log("API Response:", res.data);
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
          searchQuery: query,
          destinationId: uidToUse,
          checkin: startDate.toISOString().split("T")[0],
          checkout: endDate.toISOString().split("T")[0],
          guests: adults + children,
        },
      });
      setLoading?.(false);
      setLoadingInternal(false);

      // Update navigation data with successful results
      navigationData.hotels = hotelsList;
      
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
      // Set error message to be displayed on results page
      navigationData.error = "Failed to fetch hotels. Please try searching again or check your connection.";
    } finally {
      setLoading?.(false);
      setInternalLoading(false);
    }

    // Always navigate to results page
    navigate("/results", { state: navigationData });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: "960px",
        mx: "auto",
        borderRadius: 3,
        p: 2,
        backgroundColor: "#fff",
      }}
    >
      <Stack spacing={2}>
        {/* Destination input */}
        <Box position="relative">
          <TextField
            fullWidth
            placeholder="Enter a destination"
            value={query}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
          {suggestions.length > 0 && (
            <ul className="suggestion-list">
              {suggestions.map((d, idx) => (
                <li key={idx} role="listitem" onClick={() => handleSelectSuggestion(d)}>
                  {d.term}
                </li>
              ))}
            </ul>
          )}
        </div>
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