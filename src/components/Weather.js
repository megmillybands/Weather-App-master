import React, { useState } from "react";
import axios from "axios";
import WeatherAlert from "../WeatherAlert";

function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const apiKey = "e54b1a91b15cfa9a227758fc1e6b5c27";

  const [activeAlert, setActiveAlert] = useState(null);

  const getAlertTypeFromWeather = (weatherData) => {
    if (!weatherData || !weatherData.weather || weatherData.weather.length === 0) {
      return null;
    }

    const description = weatherData.weather[0].description.toLowerCase();
    const temp = weatherData.main.temp; // Temperature in Celsius

    if (description.includes('tornado')) return 'Tornado Warning';
    if (description.includes('thunderstorm')) return 'Severe Thunderstorm';
    if (description.includes('heavy rain') || description.includes('shower rain')) return 'Heavy Rain Alert';
    if (description.includes('snow')) return 'Winter Snow Advisory';
    if (description.includes('sleet') || description.includes('hail')) return 'Hail/Sleet Hazard';
    if (description.includes('fog') || description.includes('mist')) return 'Dense Fog Advisory';
    if (temp > 32) return 'High Heat/UV Advisory'; // ~90°F

    return null; // No specific alert
  };

  const getWeather = async () => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      const weatherData = response.data;
      setWeather(weatherData);
      setError("");
      setActiveAlert(getAlertTypeFromWeather(weatherData));
    } catch (err) {
      setError("City not found!");
      setWeather(null);
    }
  };

  return (
    <div className="weather-container">
      <h2>Check the Weather</h2>
      <input
        type="text"
        placeholder="Enter city name"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <button onClick={getWeather}>Search</button>

      {error && <p className="error">{error}</p>}

      {weather && (
        <div className="weather-info">
          <h3>{weather.name}</h3>
          <p>🌡️ {weather.main.temp}°C</p>
          <p>☁️ {weather.weather[0].description}</p>
          <p>💨 Wind: {weather.wind.speed} m/s</p>
        </div>
      )}

      {weather &&
        (activeAlert ? (
          <WeatherAlert type={activeAlert} />
        ) : (
          <div className="no-alert-message">No active weather alerts for this area.</div>
        ))}
    </div>
  );
}

export default Weather;