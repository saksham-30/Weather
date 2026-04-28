import React, { useRef, useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { FiSearch } from "react-icons/fi";
import "./SearchBar.css";

export default function SearchBar({ onSearch }) {
  const autocompleteRef = useRef(null);
  const [value, setValue] = useState("");

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry) {
      setValue(place.formatted_address || place.name);
      onSearch({
        lat: place.geometry.location.lat(),
        lon: place.geometry.location.lng(),
      });
    }
  };

  return (
    <div className="search-bar">
      <FiSearch className="search-icon" />
      <Autocomplete
        onLoad={(a) => (autocompleteRef.current = a)}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          type="text"
          placeholder="Search any city..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Autocomplete>
    </div>
  );
}
