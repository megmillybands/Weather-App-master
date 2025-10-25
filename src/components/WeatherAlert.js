import React from "react";
import "../App.css";

function WeatherAlert({ type }) {
  if (!type) return null;

  const alertColors = {
    "Tornado Warning": "#ff4b5c",
    "Severe Thunderstorm": "#f9a826",
    "Heavy Rain Alert": "#1e90ff",
    "Winter Snow Advisory": "#a6c1ee",
    "Hail/Sleet Hazard": "#00bcd4",
    "Dense Fog Advisory": "#9e9e9e",
    "High Heat/UV Advisory": "#ff9800",
  };

  const backgroundColor = alertColors[type.title] || "#444";

  return (
    <div
      className="weather-alert fade-in"
      style={{ backgroundColor }}
    >
      <span className="alert-icon">⚠️</span>
      <div className="alert-content">
        <strong>{type.title}</strong>
        <span>{type.description}</span>
      </div>
    </div>
  );
}

export default WeatherAlert;