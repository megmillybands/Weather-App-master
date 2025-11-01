import React, { useState, useEffect } from "react";

const API_KEY = "0365e1e9244f4f1d85b5f5e2e4a3b8bd";
export default function CitySearch({ onCitySelect, city, setCity, showSuggestions, setShowSuggestions }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Do not fetch suggestions if the user has just selected a city
      if (city.length < 2 || !showSuggestions) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${API_KEY}&limit=6&language=en&pretty=1&no_annotations=1`
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
          })
          // Simple de-duplication
          .filter((value, index, self) => self.indexOf(value) === index);

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
    <div style={{ position: 'relative', width: '100%' }}>
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
        <ul className="suggestions-list">
          {suggestions.map((place, index) => (
            <li
              key={index}
              style={{ color: '#000', fontWeight: 'normal', background: 'rgba(255, 255, 255, 0.3)' }}
              onClick={() => {
                setCity(place);
                setShowSuggestions(false); // Hide suggestions on selection
                onCitySelect(place);
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.5)";
                e.target.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.3)";
                e.target.style.color = "#000";
              }}
            >
              {place}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
