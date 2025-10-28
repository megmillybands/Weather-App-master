import React from "react";
import "./WeatherAlert.css"; // ✅ new animation styles
import "../App.css";

function WeatherAlert({ type }) {
  if (!type) return null;

  const alertColors = {
    "Tornado Warning": "#ff4b5c",
    "Severe Thunderstorm": "#f9a826",
    "Heavy Rain Alert": "#1e90ff",
    "Winter Snow Advisory": "#a6c1ee",
    "Sleet/Hail Hazard": "#00bcd4",
    "Flood Warning": "#2196f3",
    "High Heat/UV Advisory": "#ff9800",
  };

  // The `type` prop is now the alert object itself.
  const alertDetails = type;
  if (!alertDetails) return null;

  const backgroundColor = alertColors[alertDetails.title] || "#444";
  // Assign a default icon if one isn't provided.
  const icon = alertDetails.icon || "⚠️";

  return (
    <div className="weather-alert slide-in" style={{ backgroundColor }}>
      <span className="alert-icon">{icon}</span>
      <div className="alert-content">
        <strong>{alertDetails.title}</strong>
        <span>{alertDetails.description}</span>
      </div>
    </div>
  );
}

export default WeatherAlert;