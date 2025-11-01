// src/components/Weather.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import WeatherAlert from "./WeatherAlert";
import IssueReport from "./IssueReport";
import UseMyLocation from "./Usemylocation";
import CitySearch from "./CitySearch";
import "../App.css";
import { getAllRecords, saveRecord, deleteRecordById } from "./PostmanAPI";

export default function Weather({ city, setCity, state, setState, username: propUsername }) {
  const [username, setUsername] = useState(propUsername || "");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [localTime, setLocalTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [airQuality, setAirQuality] = useState({ status: "idle" });
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);
  const [nearestUsed, setNearestUsed] = useState(false);
  const [error, setError] = useState("");

  const openWeatherApiKey = "e54b1a91b15cfa9a227758fc1e6b5c27";
  const WAQI_API_TOKEN = "62cf31c65a6a5aa1beb30b397e2b00378f1586c9";

  // ✅ Safely get a record for a given city
  const recordForCity = useCallback(
    (name) => {
      const key = String(name || "").toLowerCase();
      return (
        records.find(
          (r) =>
            String(r?.body?.name || "").toLowerCase() === key &&
            String(r?.body?.user || "").toLowerCase() === String(username).toLowerCase()
        ) || null
      );
    },
    [records, username]
  );

  // ✅ Filter current user's favorite records safely
  const favoriteRecords = Array.isArray(records)
    ? records.filter(
        (r) =>
          r?.body?.favorite === true &&
          String(r?.body?.user || "").toLowerCase() === String(username).toLowerCase()
      )
    : [];

  // ✅ Set the favorite star state from records
  const setFavoriteFromRecords = useCallback(
    (name) => {
      const rec = recordForCity(name);
      setIsFavorite(rec?.body?.favorite === true);
    },
    [recordForCity]
  );

  // ✅ Load all records once
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
      overlay.style.background = gradients[String(type).toLowerCase()] || gradients.default;
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
    if (desc.includes("tornado")) return { title: "Tornado Warning", description: "Take shelter immediately!" };
    if (desc.includes("thunder")) return { title: "Severe Thunderstorm", description: "Thunderstorms expected." };
    if (desc.includes("rain")) return { title: "Heavy Rain Alert", description: "Drive carefully." };
    if (desc.includes("snow")) return { title: "Winter Snow Advisory", description: "Dress warmly." };
    if (desc.includes("fog") || desc.includes("mist")) return { title: "Dense Fog Advisory", description: "Low visibility ahead." };
    if (temp > 32) return { title: "High Heat/UV Advisory", description: "Stay hydrated." };
    return null;
  };

  // ---------- Air Quality ----------
  const getAirQuality = async (lat, lon) => {
    if (!WAQI_API_TOKEN) return;
    setAirQuality({ status: "loading" });
    try {
      const { data } = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_TOKEN}`);
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
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${openWeatherApiKey}&units=metric`
      );
      const grouped = {};
      res.data.list.forEach((entry) => {
        const date = new Date(entry.dt_txt).toLocaleDateString("en-US", { weekday: "short" });
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
    } catch {
      setForecast([]);
    }
  };

  // ---------- Weather Fetch ----------
  const geocodeCity = async (name) => {
    const res = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(name)}&key=0365e1e9244f4f1d85b5f5e2e4a3b8bd&limit=1&language=en`
    );
    return res.data?.results?.length > 0 ? res.data.results[0] : null;
  };

  const getWeather = useCallback(
    async (cityNameArg) => {
      const searchCity = (cityNameArg ?? city).trim();
      if (!searchCity) {
        setError("Please enter a city.");
        return;
      }
      if (isLoading) return;
      setIsLoading(true);
      setError("");

      try {
        const geoResult = await geocodeCity(searchCity);
        if (!geoResult) throw new Error("City not found.");
        const { lat, lng } = geoResult.geometry;
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${openWeatherApiKey}&units=metric`
        );

        const data = res.data;
        setTimezone(geoResult.annotations.timezone.name);
        setWeather(data);
        setActiveAlert(getAlertTypeFromWeather(data));
        updateBackground(data.weather[0].main);
        getForecast(data.name);
        if (data.coord) getAirQuality(data.coord.lat, data.coord.lon);
        setFavoriteFromRecords(data.name);
      } catch (e) {
        console.error("Weather fetch error:", e);
        setError("We couldn't find that city. Try including the state.");
        setWeather(null);
        setForecast([]);
        setActiveAlert(null);
        setAirQuality({ status: "idle" });
      } finally {
        setIsLoading(false);
      }
    },
    [city, isLoading, setFavoriteFromRecords]
  );

  // ---------- Favorite toggle ----------
  const toggleFavorite = async () => {
    if (!weather?.name) return;
    if (!username?.trim()) {
      setError("Please enter your name before saving favorites.");
      return;
    }

    const next = !isFavorite;
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

    setIsFavorite(next);
    setRecords((prev) =>
      existing ? prev.map((r) => (r.id === existing.id ? { ...r, body } : r)) : [...prev, { id: undefined, body }]
    );

    try {
      const saved = await saveRecord(payload);
      const savedId = saved?.id ?? existing?.id;
      setRecords((prev) =>
        prev.map((r) =>
          (existing && r.id === existing.id) || (!existing && r.body === body)
            ? { ...(saved || r), id: savedId, body }
            : r
        )
      );
    } catch {
      setIsFavorite(!next);
      setError("Could not save favorite. Please try again.");
    }
  };

  // ---------- Delete City ----------
  const deleteCityRecord = async (cityName) => {
    const rec = recordForCity(cityName);
    if (!rec?.id) return;
    try {
      if (weather && weather.name.toLowerCase() === cityName.toLowerCase()) {
        setIsFavorite(false);
      }
      await deleteRecordById(rec.id);
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
    } catch {
      setError("Failed to delete. Please try again.");
    }
  };

  // ---------- Local Time ----------
  const getLocalTime = useCallback(() => {
    if (!timezone) return null;
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: timezone });
  }, [timezone]);

  useEffect(() => {
    setLocalTime(getLocalTime());
    const interval = setInterval(() => setLocalTime(getLocalTime()), 60000);
    return () => clearInterval(interval);
  }, [getLocalTime]);

  if (!recordsLoaded) return <div className="loading-placeholder">Loading...</div>;

  const starStyleOn = { color: "#ffd84d", textShadow: "0 0 6px rgba(255, 199, 0, 0.45)" };
  const starStyleOff = { color: "#ccc" };

  return (
    <>
      <div className="background-overlay"></div>
      <div className="weather-container glass">
        <h2>Check the Weather</h2>
        <div className="input-row">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-row">
          <CitySearch onCitySelect={getWeather} city={city} setCity={setCity} />
          <button onClick={() => getWeather(city)} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="input-row">
          <UseMyLocation
            onWeatherFetched={getWeather}
            setLoading={setIsLoading}
            setErrorMessage={setError}
            setNearestUsed={setNearestUsed}  // ✅ Add this back
          />
        </div>

        {nearestUsed && <p style={{ color: "#555", marginTop: "8px", fontStyle: "italic" }}>📍 Showing nearest city</p>}
        {error && <div className="error-banner">{error}</div>}

        {weather && (
          <div className="weather-info fade-in">
            <h3>{weather.name}</h3>
            <p>🕐 Local Time: {localTime}</p>
            <p>🌡️ {weather.main.temp.toFixed(1)}°C ({((weather.main.temp * 9) / 5 + 32).toFixed(1)}°F)</p>
            <p>☁️ {weather.weather[0].description}</p>
            <p>💨 Wind: {weather.wind.speed} m/s</p>
            {airQuality.status === "success" && (
              <p>
                🌬️ AQI: <strong>{airQuality.data.aqi}</strong> ({airQuality.data.category})
              </p>
            )}
            <button onClick={toggleFavorite} className="favorite-btn">
              <span style={isFavorite ? starStyleOn : starStyleOff}>{isFavorite ? "★" : "☆"}</span>
              {isFavorite ? "Favorited" : "Favorite"}
            </button>

            {activeAlert ? <WeatherAlert type={activeAlert} /> : <div className="no-alert-message">No active alerts 🌤️</div>}

            {forecast.length > 0 && (
              <div className="forecast-container">
                {forecast.map((day, i) => (
                  <div key={i} className="forecast-day">
                    <strong>{day.date}</strong>
                    <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt={day.main} />
                    <p>{day.main}</p>
                    <p>H: {Math.round(day.highC)}°C / {Math.round(day.highF)}°F</p>
                    <p>L: {Math.round(day.lowC)}°C / {Math.round(day.lowF)}°F</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {username?.trim() && favoriteRecords.length > 0 && (
          <div className="favorites-section fade-in" style={{ marginTop: 16 }}>
            <h3 onClick={() => setShowFavorites(!showFavorites)} style={{ cursor: "pointer" }}>
              Your Cities {showFavorites ? "▼" : "►"}
            </h3>
            {showFavorites && (
              <div className="favorites-buttons">
                {favoriteRecords
                  .filter((r) => r && r.body && r.body.name)
                  .map((r) => {
                    const cityName = r.body.name;
                    return (
                      <div key={r.id ?? `${r.body.user}:${cityName}`} className="favorite-item">
                        <span
                          className="favorite-item-star"
                          style={r.body.favorite ? starStyleOn : starStyleOff}
                          onClick={() => toggleFavorite(cityName)}
                        >
                          {r.body.favorite ? "★" : "☆"}
                        </span>
                        <span className="favorite-item-name" onClick={() => getWeather(cityName)}>
                          {cityName}
                        </span>
                        <button className="remove-btn" onClick={() => deleteCityRecord(cityName)}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        {weather && <IssueReport user={username} city={weather.name} />}
      </div>
    </>
  );
}