// src/components/Weather.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import WeatherAlert from "./WeatherAlert";
import IssueReport from "./IssueReport";
import "../App.css";

import {
  getAllRecords,
  saveRecord,
  deleteRecordById,
} from "./PostmanAPI";

/**
 * Key upgrades:
 * 1) Robust search: tries q=city[,state], then falls back to Geocoding API to support inputs like "Water Valley".
 * 2) Per-user favorites: records include { user }, filtered to current user.
 * 3) Optimistic favorite toggle that's resilient and doesn't flip back.
 * 4) Clean error states (no alert boxes) + bogus-input handling.
 * 5) IssueReport writes to your class API.
 */

function Weather() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [username, setUsername] = useState(""); // per-user identity

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [airQuality, setAirQuality] = useState({ status: "idle" });
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);
  const [error, setError] = useState("");

  const openWeatherApiKey = "e54b1a91b15cfa9a227758fc1e6b5c27";
  const WAQI_API_TOKEN = "62cf31c65a6a5aa1beb30b397e2b00378f1586c9";

  // ---------- Helpers ----------
  const recordForCity = (name) => {
    const key = String(name || "").toLowerCase();
    return (
      records.find(
        (r) =>
          String(r?.body?.name || "").toLowerCase() === key &&
          String(r?.body?.user || "").toLowerCase() === String(username).toLowerCase()
      ) || null
    );
  };

  const favoriteRecords = records.filter(
    (r) =>
      r?.body?.favorite === true &&
      String(r?.body?.user || "").toLowerCase() === String(username).toLowerCase()
  );

  const setFavoriteFromRecords = (name) => {
    const rec = recordForCity(name);
    setIsFavorite(rec?.body?.favorite === true);
  };

  // Load all records once (then we filter by username in-memory)
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
      const { data } = await axios.get(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_TOKEN}`
      );
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
        setAirQuality({ status: "error", error: "Air quality not available." });
      }
    } catch {
      setAirQuality({ status: "error", error: "Could not fetch air quality." });
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
      setForecast([]);
    }
  };

  // ---------- Weather search with Geocoding fallback ----------
  const fetchWeatherByQuery = async (q) => {
    return axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        q
      )}&appid=${openWeatherApiKey}&units=metric`
    );
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    return axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`
    );
  };

  const geocodeCity = async (name, stateCode) => {
    // Prefer US results if no country provided
    const q = stateCode ? `${name},${stateCode},US` : `${name},US`;
    const res = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        q
      )}&limit=1&appid=${openWeatherApiKey}`
    );
    return Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
  };

  const validateCityInput = (value) => {
    // very simple bogus check: at least 2 letters
    return /[a-zA-Z]{2,}/.test(value);
  };

  const getWeather = async (cityNameArg) => {
    const searchCity = (cityNameArg ?? city).trim();
    const searchState = state.trim().toUpperCase();

    if (!searchCity) {
      setError("Please enter a city name.");
      return;
    }
    if (!validateCityInput(searchCity)) {
      setError("That doesn't look like a valid city. Try again.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      // 1) Try q=city[,state], optimized for US if state provided.
      const q = searchState ? `${searchCity},${searchState},US` : searchCity;
      let res = null;
      try {
        res = await fetchWeatherByQuery(q);
      } catch (e1) {
        // 2) Fallback: geocode then fetch by coords
        const g = await geocodeCity(searchCity, searchState || undefined);
        if (!g) throw e1;
        res = await fetchWeatherByCoords(g.lat, g.lon);
      }

      const data = res.data;
      setWeather(data);
      setActiveAlert(getAlertTypeFromWeather(data));
      updateBackground(data.weather[0].main);
      getForecast(data.name);
      if (data.coord) getAirQuality(data.coord.lat, data.coord.lon);

      // Restore favorite state for current user only
      setFavoriteFromRecords(data.name);
    } catch (e) {
      console.error("Weather fetch error:", e?.response?.data || e.message);
      const msg =
        e?.response?.data?.message ||
        "We couldn't find that city. Try including the state (e.g., Water Valley, MS).";
      setWeather(null);
      setForecast([]);
      setActiveAlert(null);
      setAirQuality({ status: "idle" });
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Favorite star style ----------
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

  // ---------- Favorite toggle ----------
  const toggleFavorite = async () => {
    if (!weather?.name) return;
    if (!username?.trim()) {
      setError("Please enter your name before saving favorites.");
      return;
    }

    const next = !isFavorite;

    // Build save body (temperature as "C°C / F°F")
    const c = Math.round(weather.main.temp);
    const f = Math.round((c * 9) / 5 + 32);
    const body = {
      type: "favorite",
      user: username.trim(),
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

    const existing = recordForCity(weather.name);
    const payload = { id: existing?.id, body };

    // Optimistic UI
    setIsFavorite(next);
    setRecords((prev) => {
      if (existing) {
        return prev.map((r) => (r.id === existing.id ? { ...r, body } : r));
      }
      // Add new
      return [...prev, { id: undefined, body }];
    });

    try {
      const saved = await saveRecord(payload);
      const savedId = saved?.id ?? existing?.id;
      setRecords((prev) =>
        prev.map((r) =>
          (existing && r.id === existing.id) || (!existing && r.body === body)
            ? { ...(saved || r), id: savedId, body: body }
            : r
        )
      );
    } catch (e) {
      console.error("Favorite toggle failed:", e);
      // Revert
      setIsFavorite(!next);
      setRecords((prev) => (existing ? prev : prev.filter((r) => r.body !== body)));
      setError("Could not save favorite. Please try again.");
    }
  };

  // Toggle from list
  const toggleFavoriteFromList = async (cityName) => {
    const record = recordForCity(cityName);
    if (!record) return;

    const next = !record.body.favorite;
    const updatedBody = { ...record.body, favorite: next };

    // Optimistic update
    setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, body: updatedBody } : r)));
    if (weather && weather.name.toLowerCase() === cityName.toLowerCase()) {
      setIsFavorite(next);
    }

    try {
      await saveRecord({ id: record.id, body: updatedBody });
    } catch (e) {
      console.error("Favorite toggle from list failed:", e);
      // Revert
      setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
      if (weather && weather.name.toLowerCase() === cityName.toLowerCase()) {
        setIsFavorite(!next);
      }
      setError("Could not update favorite. Please try again.");
    }
  };

  // Delete from list
  const deleteCityRecord = async (cityName) => {
    const rec = recordForCity(cityName);
    if (!rec?.id) return;
    try {
      if (weather && weather.name.toLowerCase() === cityName.toLowerCase()) {
        setIsFavorite(false);
      }
      await deleteRecordById(rec.id);
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
    } catch (e) {
      console.error("Error deleting record:", e);
      setError("Failed to delete. Please try again.");
    }
  };

  // Local Time
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

  if (!recordsLoaded) return <div className="loading-placeholder">Loading favorites...</div>;

  return (
    <>
      <div className="background-overlay"></div>
      <div className="weather-container glass">
        <h2>Check the Weather</h2>

        {/* Simple per-user identity so favorites are separated cleanly */}
        <div className="input-row" style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Your name (keeps your favorites separate)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div className="input-row">
          <input
            type="text"
            placeholder='Enter city name (e.g., "Water Valley")'
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getWeather()}
          />
          <input
            type="text"
            placeholder="State (e.g., MS)"
            value={state}
            onChange={(e) => setState(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getWeather()}
            style={{ width: "120px", marginLeft: "8px" }}
          />
          <button onClick={() => getWeather()} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {weather && (
          <div className="weather-info fade-in">
            <h3 className="readable-text">{weather.name}</h3>
            <p className="readable-text">🕐 Local Time: {getLocalTime()}</p>
            <p className="readable-text">
              🌡️ {weather.main.temp.toFixed(1)}°C (
              {((weather.main.temp * 9) / 5 + 32).toFixed(1)}°F)
            </p>
            <p className="readable-text">☁️ {weather.weather[0].description}</p>
            <p className="readable-text">💨 Wind: {weather.wind.speed} m/s</p>

            {airQuality.status === "success" && (
              <p className="readable-text">
                🌬️ AQI: <strong>{airQuality.data.aqi}</strong> ({airQuality.data.category})
              </p>
            )}

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

        {/* Your Cities (only current user's favorited cities) */}
        {username?.trim() && favoriteRecords.length > 0 && (
          <div className="favorites-section fade-in" style={{ marginTop: 16 }}>
            <h3
              onClick={() => setShowFavorites(!showFavorites)}
              style={{ cursor: "pointer" }}
            >
              Your Cities {showFavorites ? "▼" : "►"}
            </h3>
            {showFavorites && (
              <div className="favorites-buttons">
                {favoriteRecords.map((r) => (
                  <div key={r.id ?? `${r.body?.user}:${r.body?.name}`} className="favorite-item">
                    <span
                      className="favorite-item-star"
                      style={r.body?.favorite ? starStyleOn : starStyleOff}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteFromList(r.body?.name);
                      }}
                    >
                      {r.body?.favorite ? "★" : "☆"}
                    </span>
                    <span
                      className="favorite-item-name"
                      onClick={() => {
                        setCity(r.body?.name || "");
                        getWeather(r.body?.name);
                      }}
                    >
                      {r.body?.name}
                    </span>
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCityRecord(r.body?.name);
                      }}
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {weather && <IssueReport user={username} city={weather?.name} />}
      </div>
    </>
  );
}

export default Weather;