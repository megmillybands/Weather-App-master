import React, { useState, useEffect } from "react";

const API_KEY = "0365e1e9244f4f1d85b5f5e2e4a3b8bd";

export default function CitySearch({ onCitySelect, city, setCity }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Do not fetch suggestions if the user has just selected a city
      if (city.length < 2 || !showSuggestions) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${API_KEY}&limit=6&language=en`
        );
        const data = await response.json();

        if (data.results) {
          const places = data.results.map((result) => {
            const comp = result.components;
            const city =
              comp.city ||
              comp.town ||
              comp.village ||
              comp.municipality ||
              comp.state_district ||
              "";
            const state = comp.state_code || comp.state;
            const country = (comp.country_code &&
              { US: "USA", GB: "UK" }[comp.country_code.toUpperCase()]) ||
              comp.country;
            const display = [city, state, country]
              .filter(Boolean)
              .join(", ");
            return display;
          });
          setSuggestions(places.filter(Boolean));
        }
      } catch (error) {
        console.error("Error fetching city suggestions:", error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(debounce);
  }, [city, showSuggestions]);

  return (
    <div>
      <input
        type="text"
        value={city}
        placeholder="Search for a city"
        onChange={(e) => {
          setCity(e.target.value);
          setShowSuggestions(true); // Show suggestions when user is typing
        }}
      />

      {suggestions.length > 0 && showSuggestions && (
        <ul>
          {suggestions.map((place, index) => (
            <li
              key={index}
              onClick={() => {
                setCity(place);
                setShowSuggestions(false); // Hide suggestions on selection
                onCitySelect(place);
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
              onMouseLeave={(e) => (e.target.style.background = "#fff")}
            >
              {place}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
