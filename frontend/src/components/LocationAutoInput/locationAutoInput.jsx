import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import './locationAutoInput.css';


export default function LocationAutoInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [fuse, setFuse] = useState(null);

useEffect(() => {
  fetch('/destinations.json')
    .then((res) => res.json())
    .then((data) => {
      setDestinations(data);
      const fuseInstance = new Fuse(data, {
        keys: ['term', 'city', 'state'],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 2,
      });
      setFuse(fuseInstance);
    })
    .catch((err) => console.error('Failed to load destinations:', err));
}, []);

  const handleInput = (e) => {
    const input = e.target.value;
    onChange(input, { uid: null }); // pass updated text and reset UID

    if (input.length > 2 && fuse) {
      const results = fuse.search(input).map(r => r.item);
      setSuggestions(results.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (place) => {
    onChange(place.term, { lat: place.lat, lng: place.lng, uid: place.uid });
    setSuggestions([]);
  };

  return (
    <div className="location-autocomplete">
      <input
        type="text"
        className="search-input"
        placeholder="Select location"
        value={value}
        onChange={handleInput}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <ul className="suggestion-list">
          {suggestions.map((place) => (
            <li key={place.uid} onClick={() => handleSelect(place)}>
              {place.term}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}