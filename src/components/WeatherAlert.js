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

  const getAlertStyle = (alertType) => {
    if (!alertType) return null;
    const lower = alertType.toLowerCase();

    if (lower.includes("tornado")) {
      return { title: "Tornado Warning", description: "Take shelter immediately.", icon: "🌪️" };
    }
    if (lower.includes("thunder")) {
      return { title: "Severe Thunderstorm", description: "Strong winds and lightning expected.", icon: "⚡" };
    }
    if (lower.includes("rain")) {
      return { title: "Heavy Rain Alert", description: "Expect heavy rainfall in your area.", icon: "🌧️" };
    }
    if (lower.includes("snow")) {
      return { title: "Winter Snow Advisory", description: "Snow expected. Travel may be hazardous.", icon: "❄️" };
    }
    if (lower.includes("sleet") || lower.includes("hail")) {
      return { title: "Sleet/Hail Hazard", description: "Icy conditions possible. Drive cautiously.", icon: "🌨️" };
    }
    if (lower.includes("flood")) {
      return { title: "Flood Warning", description: "Flooding conditions expected. Avoid low areas.", icon: "🌊" };
    }
    if (lower.includes("heat") || lower.includes("uv")) {
      return { title: "High Heat/UV Advisory", description: "Stay hydrated and avoid direct sunlight.", icon: "☀️" };
    }

    return null;
  };

  const alertDetails = getAlertStyle(type);
  if (!alertDetails) return null;

  const backgroundColor = alertColors[alertDetails.title] || "#444";

  return (
    <div className="weather-alert slide-in" style={{ backgroundColor }}>
      <span className="alert-icon">{alertDetails.icon}</span>
      <div className="alert-content">
        <strong>{alertDetails.title}</strong>
        <span>{alertDetails.description}</span>
      </div>
    </div>
  );
}

export default WeatherAlert;