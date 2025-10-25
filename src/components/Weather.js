// src/components/Weather.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import WeatherAlert from "./WeatherAlert";
import IssueReport from "./IssueReport";
import "../App.css";

import {
  getAllRecords,
  saveFavoriteCity,
  deleteRecordById,
} from "./PostmanAPI";

function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [records, setRecords] = useState([]); // [{ id, body:{ name, favorite, ... } }]
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [airQuality, setAirQuality] = useState({ status: "idle" });
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const openWeatherApiKey = "e54b1a91b15cfa9a227758fc1e6b5c27";
  const WAQI_API_TOKEN = "62cf31c65a6a5aa1beb30b397e2b00378f1586c9";

  // ---------- Helpers ----------
  const recordForCity = (name) => {
    const key = String(name || "").toLowerCase();
    return (
      records.find(
        (r) => String(r?.body?.name || "").toLowerCase() === key
      ) || null
    );
  };

const favoriteRecords = records.filter(
  (r) => r?.data_json?.favorite === true
);

const setFavoriteFromRecords = (name) => {
  const rec = recordForCity(name); // or however you get the record
  setIsFavorite(rec?.data_json?.favorite === true);
};

  // ---------- Load saved records on start ----------
  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAllRecords();
        setRecords(Array.isArray(all) ? all : []);
      } catch (e) {
        console.error("Failed to load records:", e);
      } finally {
        setRecordsLoaded(true);
      }
    };
    load();
  }, []);

  // ---------- Background ----------
  const updateBackground = (type) => {
    const overlay = document.querySelector(".background-overlay");
    if (!overlay) return;
    const gradients = {
      clear: "linear-gradient(-45deg, #f6d365, #fda085, #fbc2eb, #a6c1ee)",
      clouds: "linear-gradient(-45deg, #bdc3c7, #2c3e50, #757f9a, #d7dde8)",
      rain: "linear-gradient(-45deg, #4e54c8, #8f94fb, #667db6, #0082c8)",
      thunderstorm: "linear-gradient(-45deg, #141E30, #243B55, #232526, #414345)",
      snow: "linear-gradient(-45deg, #e0eafc, #cfdef3, #f8fbff, #e2ebf0)",
      drizzle: "linear-gradient(-45deg, #89f7fe, #66a6ff, #a1c4fd, #c2e9fb)",
      mist: "linear-gradient(-45deg, #757f9a, #d7dde8, #bdc3c7, #2c3e50)",
      haze: "linear-gradient(-45deg, #ffecd2, #fcb69f, #f6d365, #fda085)",
      smoke: "linear-gradient(-45deg, #434343, #000000, #232526, #414345)",
      default: "linear-gradient(-45deg, #89f7fe, #66a6ff, #a1c4fd, #c2e9fb)",
    };
    overlay.style.transition = "opacity 1.5s ease-in-out, background 1.5s ease-in-out";
    overlay.style.opacity = 0;
    setTimeout(() => {
      overlay.style.background =
        gradients[String(type).toLowerCase()] || gradients.default;
      overlay.style.backgroundSize = "400% 400%";
      overlay.style.animation = "gradientMove 15s ease infinite";
      overlay.style.opacity = 1;
    }, 500);
  };

  // ---------- Alerts ----------
  const getAlertTypeFromWeather = (data) => {
    if (!data?.weather?.length) return null;
    const desc = data.weather[0].description.toLowerCase();
    const temp = data.main.temp;
    if (desc.includes("tornado"))
      return { title: "Tornado Warning", description: "Take shelter immediately!" };
    if (desc.includes("thunder"))
      return { title: "Severe Thunderstorm", description: "Thunderstorms expected." };
    if (desc.includes("rain"))
      return { title: "Heavy Rain Alert", description: "Drive carefully." };
    if (desc.includes("snow"))
      return { title: "Winter Snow Advisory", description: "Dress warmly." };
    if (desc.includes("fog") || desc.includes("mist"))
      return { title: "Dense Fog Advisory", description: "Low visibility ahead." };
    if (temp > 32)
      return { title: "High Heat/UV Advisory", description: "Stay hydrated." };
    return null;
  };

  // ---------- AQI ----------
  const getAirQuality = async (lat, lon) => {
    if (!WAQI_API_TOKEN) return;
    setAirQuality({ status: "loading" });
    try {
      const response = await axios.get(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_TOKEN}`
      );
      const { data } = response;
      if (data.status === "ok" && data.data.aqi != null) {
        const aqi = data.data.aqi;
        let category;
        if (aqi <= 50) category = "Good";
        else if (aqi <= 100) category = "Moderate";
        else if (aqi <= 150) category = "Unhealthy for Sensitive Groups";
        else if (aqi <= 200) category = "Unhealthy";
        else if (aqi <= 300) category = "Very Unhealthy";
        else category = "Hazardous";
        setAirQuality({ status: "success", data: { aqi, category } });
      } else {
        setAirQuality({ status: "error", error: "Data not available." });
      }
    } catch {
      setAirQuality({ status: "error", error: "Could not fetch data." });
    }
  };

  // ---------- Forecast ----------
  const getForecast = async (cityName) => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          cityName
        )}&appid=${openWeatherApiKey}&units=metric`
      );

      const grouped = {};
      res.data.list.forEach((entry) => {
        const date = new Date(entry.dt_txt).toLocaleDateString("en-US", {
          weekday: "short",
        });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(entry);
      });

      const dailyForecast = Object.values(grouped)
        .slice(0, 5)
        .map((entries) => {
          const date = new Date(entries[0].dt_txt);
          const temps = entries.map((e) => e.main.temp);
          const highC = Math.max(...temps);
          const lowC = Math.min(...temps);
          return {
            date: date.toLocaleDateString("en-US", { weekday: "short" }),
            highC,
            lowC,
            highF: (highC * 9) / 5 + 32,
            lowF: (lowC * 9) / 5 + 32,
            icon: entries[0].weather[0].icon,
            main: entries[0].weather[0].main,
          };
        });

      setForecast(dailyForecast);
    } catch (e) {
      console.error("Forecast fetch error:", e);
    }
  };

  // ---------- Weather (S2: no backend writes on search) ----------
  const getWeather = async (cityName = city) => {
    if (!cityName) return;

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&appid=${openWeatherApiKey}&units=metric`
      );
      const data = res.data;

      setWeather(data);
      setActiveAlert(getAlertTypeFromWeather(data));
      updateBackground(data.weather[0].main);
      getForecast(data.name);
      if (data.coord) getAirQuality(data.coord.lat, data.coord.lon);

      // Restore favorite state from records only (no writes)
      setFavoriteFromRecords(data.name);
    } catch (e) {
      console.error("Weather fetch error:", e);
      setWeather(null);
      setForecast([]);
      setActiveAlert(null);
      setAirQuality({ status: "idle" });
      alert("City not found!");
    }
  };

  // ---------- Gradient gold star style (G3) ----------
  const starStyleOn = {
    background:
      "linear-gradient(135deg, #fff7b1 0%, #ffd84d 30%, #ffb300 60%, #ffdb6e 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textShadow: "0 0 6px rgba(255, 199, 0, 0.45)",
    fontSize: "1.05rem",
  };
  const starStyleOff = { color: "inherit", fontSize: "1.05rem" };

  // ---------- Favorite toggle (writes + refreshes list) ----------
  const toggleFavorite = async () => {
    if (!weather?.name) return;

    const next = !isFavorite;

    // Build save body (temperature as "C°C / F°F")
    const c = Math.round(weather.main.temp);
    const f = Math.round((c * 9) / 5 + 32);
    const body = {
      name: weather.name,
      temperature: `${c}°C / ${f}°F`,
      weather: weather.weather[0].description,
      wind: `${weather.wind.speed}m/s`,
      AQI:
        airQuality?.status === "success"
          ? `${airQuality.data.aqi} (${airQuality.data.category})`
          : "",
      favorite: next,
    };

    // Use existing id if present so backend updates rather than creating duplicates
    const existing = recordForCity(weather.name);
    const payload = { id: existing?.id, body };

    // Optimistic update
    setIsFavorite(next);

    try {
      await saveFavoriteCity(payload);

      // Refresh list from backend
      const updated = await getAllRecords();
      setRecords(Array.isArray(updated) ? updated : []);

      // Reconcile isFavorite from fresh records
      setFavoriteFromRecords(weather.name);
    } catch (e) {
      console.error("Favorite toggle failed:", e);
      // Rollback if save failed
      setIsFavorite(!next);
    }
  };

  // ---------- Delete from list (only available for favorited cities) ----------
  const deleteCityRecord = async (cityName) => {
    const rec = recordForCity(cityName);
    if (!rec?.id) return;
    try {
      await deleteRecordById(rec.id);
      const updated = await getAllRecords();
      setRecords(Array.isArray(updated) ? updated : []);
      if (weather && weather.name.toLowerCase() === cityName.toLowerCase()) {
        setIsFavorite(false);
      }
    } catch (e) {
      console.error("Error deleting record:", e);
    }
  };

  // ---------- Local Time ----------
  const getLocalTime = () => {
    if (!weather?.timezone) return null;
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const localTime = new Date(utc + weather.timezone * 1000);
    return localTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!recordsLoaded)
    return <div className="loading-placeholder">Loading favorites...</div>;

  return (
    <>
      <div className="background-overlay"></div>
      <div className="weather-container glass">
        <h2>Check the Weather</h2>
        <div className="input-row">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getWeather()}
          />
        <button onClick={() => getWeather()}>Search</button>
        </div>

        {weather && (
          <div className="weather-info fade-in">
            <h3>{weather.name}</h3>
            <p>🕐 Local Time: {getLocalTime()}</p>
            <p>
              🌡️ {weather.main.temp.toFixed(1)}°C (
              {((weather.main.temp * 9) / 5 + 32).toFixed(1)}°F)
            </p>
            <p>☁️ {weather.weather[0].description}</p>
            <p>💨 Wind: {weather.wind.speed} m/s</p>

            {airQuality.status === "success" && (
              <p>
                🌬️ AQI: <strong>{airQuality.data.aqi}</strong> (
                {airQuality.data.category})
              </p>
            )}

            {/* Favorite button (Option A text) */}
            <button
              onClick={toggleFavorite}
              className="favorite-btn"
              title={isFavorite ? "Click to unfavorite" : "Click to favorite"}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span style={isFavorite ? starStyleOn : starStyleOff}>
                {isFavorite ? "★" : "☆"}
              </span>
              {isFavorite ? "Favorited" : "Favorite"}
            </button>

            {/* Your Cities (L2: show only favorited) */}
            {favoriteRecords.length > 0 && (
              <div className="favorites-section" style={{ marginTop: 16 }}>
                <h3>Your Cities</h3>
                <div className="favorites-buttons">
                  {favoriteRecords.map((r) => (
                    <div key={r.id ?? r.body?.name} className="favorite-item">
                      <span onClick={() => getWeather(r.body?.name)}>
                        {/* show star based on favorite */}
                        {r.body?.favorite ? "★ " : "☆ "}
                        {r.body?.name}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => deleteCityRecord(r.body?.name)}
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeAlert ? (
              <WeatherAlert type={activeAlert} />
            ) : (
              <div className="no-alert-message">No active weather alerts 🌤️</div>
            )}

            {forecast.length > 0 && (
              <div className="forecast-container">
                {forecast.map((day, i) => (
                  <div key={i} className="forecast-day">
                    <strong>{day.date}</strong>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                      alt={day.main}
                    />
                    <p>{day.main}</p>
                    <p>H: {Math.round(day.highC)}°C / {Math.round(day.highF)}°F</p>
                    <p>L: {Math.round(day.lowC)}°C / {Math.round(day.lowF)}°F</p>
                  </div>
                ))}
              </div>
            )}
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
      </div>
    </>
  );
}

export default Weather;