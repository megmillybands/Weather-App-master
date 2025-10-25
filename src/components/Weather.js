import React, { useState, useEffect } from "react";
import axios from "axios";
import WeatherAlert from "./WeatherAlert";
import IssueReport from "./IssueReport";
import "../App.css";

function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [airQuality, setAirQuality] = useState({ status: 'idle' });

  const openWeatherApiKey = "e54b1a91b15cfa9a227758fc1e6b5c27";
  const WAQI_API_TOKEN = "62cf31c65a6a5aa1beb30b397e2b00378f1586c9"; // <-- PASTE YOUR TOKEN FROM https://aqicn.org/data-platform/token/
  
  
  const getAlertTypeFromWeather = (data) => {
    if (!data?.weather?.length) return null;
    const desc = data.weather[0].description.toLowerCase();
    const temp = data.main.temp;
    if (desc.includes("tornado")) return "Tornado Warning";
    if (desc.includes("thunderstorm")) return "Severe Thunderstorm";
    if (desc.includes("rain")) return "Heavy Rain Alert";
    if (desc.includes("snow")) return "Winter Snow Advisory";
    if (desc.includes("hail") || desc.includes("sleet"))
      return "Hail/Sleet Hazard";
    if (desc.includes("fog") || desc.includes("mist"))
      return "Dense Fog Advisory";
    if (temp > 32) return "High Heat/UV Advisory";
    return null;
  };

  useEffect(() => {
    const saved = localStorage.getItem("favoriteCities");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("favoriteCities", JSON.stringify(favorites));
  }, [favorites]);

  const getAirQuality = async (lat, lon) => {
    if (WAQI_API_TOKEN === "YOUR_WAQI_API_TOKEN_HERE") {
      console.warn("WAQI API token is not set. Air quality feature is disabled.");
      setAirQuality({ status: 'error', error: 'API token not configured.' });
      return;
    }
    setAirQuality({ status: 'loading' });
    try {
      const response = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_TOKEN}`);
      const { data } = response;
      if (data.status === 'ok' && data.data.aqi) {
        const aqi = data.data.aqi;
        let category;
        if (aqi <= 50) category = 'Good';
        else if (aqi <= 100) category = 'Moderate';
        else if (aqi <= 150) category = 'Unhealthy for Sensitive Groups';
        else if (aqi <= 200) category = 'Unhealthy';
        else if (aqi <= 300) category = 'Very Unhealthy';
        else category = 'Hazardous';
        setAirQuality({ status: 'success', data: { aqi, category } });
      } else {
        setAirQuality({ status: 'error', error: 'Data not available.' });
      }
    } catch (error) {
      console.error('Error fetching air quality:', error);
      setAirQuality({ status: 'error', error: 'Could not fetch data.' });
    }
  };

  useEffect(() => {
    if (weather?.coord) {
      getAirQuality(weather.coord.lat, weather.coord.lon);
    }
  }, [weather]);

  const getWeather = async (cityName = city) => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${openWeatherApiKey}&units=metric`
      );
      setWeather(res.data);
      setError("");
      setActiveAlert(getAlertTypeFromWeather(res.data));
      updateBackground(res.data.weather[0].main);
      getForecast(cityName);
    } catch {
      setError("City not found!");
      setWeather(null);
      setAirQuality({ status: 'idle' });
      setForecast([]);
    }
  };

  const getForecast = async (cityName) => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${openWeatherApiKey}&units=metric`
      );
      const grouped = {};
      res.data.list.forEach((e) => {
        const date = new Date(e.dt_txt).toLocaleDateString("en-US", {
          weekday: "short",
        });
        if (!grouped[date]) grouped[date] = e;
      });
      setForecast(Object.values(grouped).slice(0, 5));
    } catch (e) {
      console.error("Forecast fetch error:", e);
    }
  };

  const [isFavorite, setIsFavorite] = useState(false);

  const addToFavorites = () => {
    setFavorites([...favorites, weather.name]);
  };

  const removeFromFavorites = (cityName) => {
    setFavorites(favorites.filter((f) => f !== cityName));
  };

  const favoritesButtonPress = () => {
    if (weather && !favorites.includes(weather.name)) {
      addToFavorites();
      setIsFavorite(true);
    } else if (weather && favorites.includes(weather.name)) {
      removeFromFavorites(weather.name);
      setIsFavorite(false);
    }
  };

  const updateBackground = (type) => {
    const overlay = document.querySelector(".background-overlay");
    if (!overlay) return;
    const gradients = {
      clear: "linear-gradient(-45deg, #f6d365, #fda085, #fbc2eb, #a6c1ee)",
      clouds: "linear-gradient(-45deg, #bdc3c7, #2c3e50, #757f9a, #d7dde8)",
      rain: "linear-gradient(-45deg, #4e54c8, #8f94fb, #667db6, #0082c8)",
      thunderstorm:
        "linear-gradient(-45deg, #141E30, #243B55, #232526, #414345)",
      snow: "linear-gradient(-45deg, #e0eafc, #cfdef3, #f8fbff, #e2ebf0)",
      drizzle: "linear-gradient(-45deg, #89f7fe, #66a6ff, #a1c4fd, #c2e9fb)",
      mist: "linear-gradient(-45deg, #757f9a, #d7dde8, #bdc3c7, #2c3e50)",
      haze: "linear-gradient(-45deg, #ffecd2, #fcb69f, #f6d365, #fda085)",
      smoke: "linear-gradient(-45deg, #434343, #000000, #232526, #414345)",
      dust: "linear-gradient(-45deg, #eacda3, #d6ae7b, #cbb4d4, #20002c)",
      default: "linear-gradient(-45deg, #89f7fe, #66a6ff, #a1c4fd, #c2e9fb)",
    };
    overlay.style.transition =
      "opacity 1.5s ease-in-out, background 1.5s ease-in-out";
    overlay.style.opacity = 0;
    setTimeout(() => {
      overlay.style.background =
        gradients[type.toLowerCase()] || gradients.default;
      overlay.style.backgroundSize = "400% 400%";
      overlay.style.animation = "gradientMove 15s ease infinite";
      overlay.style.opacity = 1;
    }, 500);
  };
  const getLocalTime = () => {
  if (!weather?.timezone) return null;
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTime = new Date(utc + (weather.timezone * 1000));
  return localTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

  return (
    <>
      <div className="background-overlay"></div>
      <div className="weather-container glass">
        <h2 className="fade-in">Check the Weather</h2>
        <div className="input-row">
          <input
            id="city-input"
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && getWeather() && setIsFavorite(false)
            }
          />
          <button onClick={() => getWeather() && setIsFavorite(false)}>
            Search
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {weather && (
          <div className="weather-info fade-in">
            <h3>{weather.name}</h3>
            <p>🕐 Local Time: {getLocalTime()}</p>
            <p>
              🌡️ {Math.round(weather.main.temp)}°C ({Math.round((weather.main.temp * 9) / 5 + 32)}°F)
            </p>
            <p>☁️ {weather.weather[0].description}</p>
            <p>💨 Wind: {weather.wind.speed} m/s</p>

            {airQuality.status === 'loading' && <p>🌬️ Air Quality Index: Loading...</p>}
            {airQuality.status === 'error' && <p>🌬️ Air Quality Index: Not available</p>}
            {airQuality.status === 'success' && (
              <p>
                🌬️ Air Quality Index: <strong>{airQuality.data.aqi}</strong> ({airQuality.data.category})
              </p>
            )}


            <button onClick={favoritesButtonPress} className="favorite-btn">
              {isFavorite ? "⭐ Saved" : "☆ Save to Favorites"}
            </button>
          </div>
        )}

        {activeAlert ? (
          <WeatherAlert type={activeAlert} />
        ) : (
          <div className="no-alert-message centered">
            No active weather alerts 🌤️
          </div>
        )}

        {forecast.length > 0 && (
          <div className="forecast-container fade-in">
            <h3>5-Day Forecast</h3>
            <div className="forecast-grid">
              {forecast.map((day, index) => (
                <div key={index} className="forecast-card">
                  <strong>
                    {new Date(day.dt_txt).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </strong>
                  <img
                    className="weather-icon"
                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                    alt={day.weather[0].description}
                  />
                  <p>{day.weather[0].main}</p>
                  <p>{Math.round(day.main.temp)}°C</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="issue-report-section">
          <div
            className={`report-issue-toggle ${showIssueReport ? "open" : ""}`}
            onClick={() => setShowIssueReport(!showIssueReport)}
          >
            {showIssueReport ? "Close" : "Report an Issue"}
          </div>
          {showIssueReport && <IssueReport />}
        </div>

        {favorites.length > 0 && (
          <div className="favorites-section fade-in">
            <h3>Your Favorite Cities</h3>
            <div className="favorites-list">
              {favorites.map((fav) => (
                <div key={fav} className="favorite-item">
                  <span
                    onClick={() => getWeather(fav) && setIsFavorite(true)}
                    id="favorite-city"
                  >
                    {fav}
                  </span>
                  <button
                    onClick={() => removeFromFavorites(fav)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Weather;
