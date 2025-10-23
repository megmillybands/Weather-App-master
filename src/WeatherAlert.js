import React from "react";

const WeatherAlert = ({ type, title, description }) => {
  if (!type) return null;

  const getAlertStyle = (alertType) => {
    const lowerCaseType = alertType.toLowerCase();
    if (lowerCaseType.includes(" no alert")) {
        return null;
    }
    if (lowerCaseType.includes("rain")) {
      return {
        title: "Heavy Rain Alert",
        description: "Expect heavy rainfall in your area.",
        icon: "🌧️"
      };
    } else if (lowerCaseType.includes("thunder")) {
      return {
        title: "Severe Thunderstorm",
        description: "Severe thunderstorm expected.",
        icon: "⚡"
      };
    } else if (lowerCaseType.includes("snow")) {
      return {
        title: "Winter Storm Advisory",
        description: "Winter Storm Advisory active.",
        icon: "❄️"
      };
    } else if (lowerCaseType.includes("sun") || lowerCaseType.includes("clear") || lowerCaseType.includes("heat")) {
      return {
        title: "High Heat/UV Advisory",
        description: "High temperatures expected.",
        icon: "☀️"
      };
    } else if (lowerCaseType.includes("tornado watch")) {
      return {
        title: "Tornado Watch",
        description: "Conditions are favorable for a tornado.",
        icon: "🌪️"
      };
    } else if (lowerCaseType.includes("tornado")) {
      return {
        title: "Tornado Warning",
        description: "Tornado warning in this area until further notice.",
        icon: "🌪️"
      };
    } else if (lowerCaseType.includes("sleet") || lowerCaseType.includes("hail")) {
      return {
        title: "Sleet/Hail Hazard",
        description: "Slippery roads and reduced visibility due to sleet and small hail. Drive slowly and increase following distance.",
        icon: "🌨️"
      };
    } else if (lowerCaseType.includes("fog")){
        return {
            title: "Dense Fog Advisory",
            description: "Reduced visibility due to dense fog. Use low beam headlights and drive cautiously.",
            icon: "🌫️"
        };
    } else if (lowerCaseType.includes("flood")) {
      return {
        title: "Flash Flood Warning",
        description: "Flooding is expected or occurring. Move to higher ground.",
        icon: "🌊"
      };
    }  else if (lowerCaseType.includes("emergency")) {
      return {
        title: "Flash Flood Warning",
        description: "Heavy rainfall causing flash flooding conditions expected.",
        icon: "⚠️"
      };
    
    } else {
      return {
        title,
        description,
        icon: "⚠️"
      };
    }
  };

  const alert = getAlertStyle(type);

  if (!alert) return null;

  return (
    <div className={`alert-box ${type.toLowerCase()}`}>
      <div className="alert-icon">{alert.icon}</div>
      <div className="alert-content">
        <strong>{alert.title}</strong>
        <p>{alert.description}</p>
      </div>
    </div>
  );
};

export default WeatherAlert;
