import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
import './SearchBar.css';

export default function SearchBar({ onHotelsFetched, setLoading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedUID, setSelectedUID] = useState(null);
  const metaRef = useRef({}); // for passing meta from LocationAutoInput

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    fetch('/destinations.json')
      .then((res) => res.json())
      .then((data) => setDestinations(data));
  }, []);

  // Memoize fuse instance
  const fuseInstance = useMemo(() => {
    return new Fuse(destinations, {
      keys: ['term', 'city', 'state'],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
    });
  }, [destinations]);

  // debounce only suggestion logic, not setQuery
  const debouncedSuggest = useRef(
    debounce((input, fuse) => {
      if (input.length > 1 && fuse) {
        const results = fuse.search(input).map(r => r.item);
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
    metaRef.current = {}; // reset meta
    debouncedSuggest(input, fuseInstance);
  };

  const handleSelectSuggestion = (destination) => {
    setQuery(destination.term);
    setSelectedUID(destination.uid);
    setSuggestions([]);
    metaRef.current = { uid: destination.uid }; // update metaRef for handleSearch
  };

  const handleSearch = async (meta = {}) => {
    console.log('handleSearch triggered', { query, metaRef: metaRef.current, selectedUID });
    if (!query) {
      alert('Please enter a destination.');
      return;
    }

    // us UID from meta (from LocationAutoInput) or selectedUID or fallback
    let uidToUse = meta.uid || metaRef.current.uid || selectedUID;
    console.log('Initial UID:', uidToUse);
    if (!uidToUse) {
      const fuseMatch = fuseInstance.search(query);
      console.log('Fuse matches:', fuseMatch);

      if (fuseMatch.length > 0) {
        const corrected = fuseMatch[0].item;
        uidToUse = corrected.uid;
        setQuery(corrected.term); // update input with corrected term
        console.log('Using fuzzy UID:', uidToUse);
      } else {
        const fallbackMatch = destinations.find((d) =>
          d.term?.toLowerCase().includes(query.toLowerCase())
        );
        if (fallbackMatch) {
          uidToUse = fallbackMatch.uid;
          setQuery(fallbackMatch.term); // update input with corrected term
          console.log('Using fallback UID:', uidToUse);
        }
      }
    }

    setSuggestions([]); // hide dropdown after search

    if (!uidToUse) {
      alert('Destination not recognized. Please try again.');
      return;
    }

    console.log("UID to search with:", uidToUse);

    setLoading?.(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/hotelproxy/hotels/uid/${uidToUse}`);
      console.log(res.data)
      const hotelsList = Array.isArray(res.data) ? res.data : res.data.hotels || [];
      setHotels(hotelsList);
      onHotelsFetched?.(hotelsList);
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
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
                <button onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                <span>{adults}</span>
                <button onClick={() => setAdults(adults + 1)}>+</button>
              </div>

              <div className="counter">
                <label>Children</label>
                <button onClick={() => setChildren(Math.max(0, children - 1))}>−</button>
                <span>{children}</span>
                <button onClick={() => setChildren(children + 1)}>+</button>
              </div>

              <div className="counter">
                <label>Rooms</label>
                <button onClick={() => setRooms(Math.max(1, rooms - 1))}>−</button>
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
