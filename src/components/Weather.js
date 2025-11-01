// src/components/Weather.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import WeatherAlert from "./WeatherAlert";
import IssueReport from "./IssueReport";
import UseMyLocation from "./Usemylocation";
import CitySearch from "./CitySearch";
import "../App.css";
import { saveRecord, deleteRecordById } from "./PostmanAPI";

export default function Weather({ city, setCity, state, setState, username: propUsername }) {
  const [username, setUsername] = useState(propUsername || "");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Update username when prop changes (e.g., after login)
  useEffect(() => {
    if (propUsername) {
      setUsername(propUsername);
    }
  }, [propUsername]);
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flippedCard, setFlippedCard] = useState(null);

  const openWeatherApiKey = "e54b1a91b15cfa9a227758fc1e6b5c27";
  const WAQI_API_TOKEN = "62cf31c65a6a5aa1beb30b397e2b00378f1586c9";

  // ✅ Safely get a record for a given city
  const recordForCity = useCallback(
    (name) => {
      const key = String(name || "").toLowerCase().trim();
      const currentUser = String(username || "").toLowerCase().trim();
      return (
        records.find(
          (r) =>
            String(r?.body?.name || "").toLowerCase().trim() === key &&
            String(r?.body?.user || "").toLowerCase().trim() === currentUser
        ) || null
      );
    },
    [records, username]
  );
  
  // Generate a unique key for a city+user combo
  const getCityKey = (cityName, user) => {
    const cleanUser = String(user || '').trim().toLowerCase().replace(/\s+/g, '');
    const cleanCity = String(cityName || '').trim().toLowerCase().replace(/\s+/g, '');
    return `${cleanUser}_${cleanCity}`;
  };

  // ✅ Filter current user's favorite records safely
  const favoriteRecords = Array.isArray(records)
    ? records.filter(
        (r) => {
          const recordUser = String(r?.body?.user || "").toLowerCase().trim();
          const currentUser = String(username || "").toLowerCase().trim();
          // Only log matches for debugging
          if (recordUser === currentUser && r?.body?.favorite === true) {
            console.log("✅ Found favorite:", r?.body?.name, "for user:", currentUser);
          }
          return r?.body?.favorite === true && recordUser === currentUser;
        }
      )
    : [];
  
  // Debug: Log the actual array
  console.log("📊 Favorite records count:", favoriteRecords.length, "Username:", username);

  // ✅ Set the favorite star state from records
  const setFavoriteFromRecords = useCallback(
    (name) => {
      const rec = recordForCity(name);
      setIsFavorite(rec?.body?.favorite === true);
    },
    [recordForCity]
  );

  // ✅ Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('weatherFavorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecords(Array.isArray(parsed) ? parsed : []);
        console.log("✅ Loaded", parsed?.length || 0, "favorites from localStorage");
      }
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
    } finally {
      setRecordsLoaded(true);
    }
  }, []);
  
  // Save to localStorage whenever records change
  useEffect(() => {
    if (recordsLoaded && records.length >= 0) {
      localStorage.setItem('weatherFavorites', JSON.stringify(records));
      console.log("💾 Saved", records.length, "favorites to localStorage");
    }
  }, [records, recordsLoaded]);

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
    
    // Check if user is signed in (not a guest)
    if (username === "Guest") {
      setError("🔒 Please log in to save favorite cities!");
      return;
    }
    
    if (!username?.trim()) {
      setError("Please enter your name before saving favorites.");
      return;
    }

    // Check max favorites limit (5)
    const MAX_FAVORITES = 5;
    if (!isFavorite && favoriteRecords.length >= MAX_FAVORITES) {
      setError(`You can only have up to ${MAX_FAVORITES} favorite cities.`);
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
    
    // Check if existing ID is a generated one (contains underscore from city_user pattern)
    const existingId = existing?.id;
    const isGeneratedId = existingId && existingId.includes('_') && !existingId.match(/^[0-9a-f]{24}$/);
    
    // Only pass real backend IDs, not generated ones
    const payload = { 
      id: (existingId && !isGeneratedId) ? existingId : undefined, 
      body 
    };

    // Optimistic UI update
    setIsFavorite(next);
    
    try {
      console.log("📤 Sending to backend:", payload);
      // Save to backend (always as new if we have no real backend ID)
      const saved = await saveRecord(payload);
      console.log("💾 Backend response:", saved);
      console.log("📦 Full body sent:", body);
      
      // Use backend ID if available, otherwise use generated ID
      const backendId = saved?.id || saved?._id || saved?.data?.id;
      const savedId = backendId || getCityKey(weather.name, username);
      console.log("🔑 ID assigned:", savedId, backendId ? "(from backend)" : "(generated locally)");
      
      // Update records with saved data
      if (existing) {
        // Update existing record
        setRecords((prev) =>
          prev.map((r) => {
            const rKey = getCityKey(r?.body?.name, r?.body?.user);
            const targetKey = getCityKey(weather.name, username);
            return rKey === targetKey ? { ...r, id: savedId, body } : r;
          })
        );
      } else {
        // Add new record
        setRecords((prev) => [...prev, { id: savedId, body }]);
      }
      
    } catch (error) {
      console.error("❌ Save error:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Revert optimistic update
      setIsFavorite(!next);
      setError(`Could not save favorite: ${error.message}`);
    }
  };

  // ---------- Delete City ----------
  const deleteCityRecord = async (cityName) => {
    console.log("🗑️ Attempting to delete:", cityName);
    const rec = recordForCity(cityName);
    console.log("📋 Found record:", rec);
    
    if (!rec) {
      console.log("❌ No record found");
      return;
    }
    
    // Update UI immediately (optimistic delete)
    const cityKey = getCityKey(cityName, username);
    setRecords((prev) => prev.filter((r) => {
      const rKey = getCityKey(r?.body?.name, r?.body?.user);
      return rKey !== cityKey;
    }));
    
    // Update favorite star if we're viewing this city
    if (weather && weather.name.toLowerCase() === cityName.toLowerCase()) {
      setIsFavorite(false);
    }
    
    // Try to delete from backend if we have an ID
    if (rec.id && rec.id !== getCityKey(rec.body?.name, rec.body?.user)) {
      try {
        await deleteRecordById(rec.id);
        console.log("✅ Successfully deleted from backend");
      } catch (error) {
        console.error("⚠️ Backend delete failed (but removed from UI):", error);
      }
    } else {
      console.log("ℹ️ No backend ID, removed from UI only");
    }
  };

  // ---------- Local Time ----------
  const getLocalTime = useCallback(() => {
    if (!timezone) return null;
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: timezone });
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
          <CitySearch 
            onCitySelect={getWeather} 
            city={city} 
            setCity={setCity}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
          />
          <button onClick={() => getWeather(city)} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="input-row">
          <UseMyLocation
            onWeatherFetched={async (weatherData, location) => {
              if (location?.useExactLocation && location?.coordinates) {
                const { latitude, longitude } = location.coordinates;
                setIsLoading(true);
                setError("");
                setShowSuggestions(false);
                
                if (location.locationName) {
                  setCity(location.locationName);
                }
                setNearestUsed(!!location.nearestUsed);
                
                try {
                  const res = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}&units=metric`
                  );
                  
                  const data = res.data;
                  if (location.timezone) setTimezone(location.timezone);
                  setWeather(data);
                  setActiveAlert(getAlertTypeFromWeather(data));
                  updateBackground(data.weather[0].main);
                  getForecast(data.name);
                  if (data.coord) getAirQuality(data.coord.lat, data.coord.lon);
                  setFavoriteFromRecords(data.name);
                } catch (e) {
                  console.error("Error fetching weather:", e);
                  setError("Could not fetch weather for your location.");
                  setWeather(null);
                } finally {
                  setIsLoading(false);
                }
              } else if (location?.city) {
                getWeather(location.city);
              }
            }}
            setLoading={setIsLoading}
            setErrorMessage={setError}
          />
        </div>

        {nearestUsed && <p style={{ color: "#555", marginTop: "8px", fontStyle: "italic" }}>📍 Showing nearest city</p>}
        {error && <div className="error-banner">{error}</div>}

        {weather && (
          <div className="weather-info fade-in">
            <p className="readable-text" style={{ textAlign: 'left', width: '100%', fontSize: '1.8rem', marginBottom: '0.2rem' }}>{localTime}</p>
            <h3 className="readable-text" style={{ fontSize: '3.2rem', margin: '0.2rem 0' }}>{weather.name}</h3>
            <p className="readable-text" style={{ fontSize: '4rem', fontWeight: 'bold', margin: '0.2rem 0' }}>
              {Math.round((weather.main.temp * 9) / 5 + 32)}°F
            </p>
            <p className="readable-text" style={{ textTransform: 'capitalize', fontSize: '1.5rem', margin: '0.5rem 0' }}>{weather.weather[0].description}</p>
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
                    <p>H: {Math.round(day.highC)}°C / {Math.round(day.highF)}°F</p>
                    <p>L: {Math.round(day.lowC)}°C / {Math.round(day.lowF)}°F</p>
                  </div>
                ))}
              </div>
            )}

            <div className="weather-extra-details-container">
              {weather.wind?.speed > 0 && (
                <div 
                  className="weather-extra-details-box"
                  style={{ flex: '1 1 120px', cursor: 'pointer' }}
                  onClick={() => setFlippedCard(flippedCard === 'wind' ? null : 'wind')}
                >
                  <div className={`flip-card-inner ${flippedCard === 'wind' ? 'flipped' : ''}`}>
                    <div className="flip-card-front">
                      <p className="card-icon">💨</p>
                      <p>Wind</p>
                      <p>{weather.wind.speed} m/s</p>
                    </div>
                    <div className="flip-card-back">
                      <p><strong>Wind Speed</strong></p>
                      <p>{weather.wind.speed} m/s</p>
                      <p>{(weather.wind.speed * 2.237).toFixed(1)} mph</p>
                      <p>Direction: {weather.wind.deg}°</p>
                    </div>
                  </div>
                </div>
              )}
              {weather.main?.humidity !== undefined && (
                <div 
                  className="weather-extra-details-box"
                  style={{ flex: '1 1 120px', cursor: 'pointer' }}
                  onClick={() => setFlippedCard(flippedCard === 'humidity' ? null : 'humidity')}
                >
                  <div className={`flip-card-inner ${flippedCard === 'humidity' ? 'flipped' : ''}`}>
                    <div className="flip-card-front">
                      <p className="card-icon">💧</p>
                      <p>Humidity</p>
                      <p>{weather.main.humidity}%</p>
                    </div>
                    <div className="flip-card-back">
                      <p><strong>Humidity</strong></p>
                      <p>{weather.main.humidity}%</p>
                      <p>{weather.main.humidity < 30 ? 'Low - Dry conditions' : weather.main.humidity < 60 ? 'Comfortable' : weather.main.humidity < 80 ? 'High - May feel sticky' : 'Very High - Muggy'}</p>
                    </div>
                  </div>
                </div>
              )}
              {weather.visibility !== undefined && (
                <div 
                  className="weather-extra-details-box"
                  style={{ flex: '1 1 120px', cursor: 'pointer' }}
                  onClick={() => setFlippedCard(flippedCard === 'visibility' ? null : 'visibility')}
                >
                  <div className={`flip-card-inner ${flippedCard === 'visibility' ? 'flipped' : ''}`}>
                    <div className="flip-card-front">
                      <p className="card-icon">👁️</p>
                      <p>Visibility</p>
                      <p>{(weather.visibility / 1000).toFixed(1)} km</p>
                    </div>
                    <div className="flip-card-back">
                      <p><strong>Visibility</strong></p>
                      <p>{(weather.visibility / 1000).toFixed(1)} km</p>
                      <p>{(weather.visibility / 1609.34).toFixed(1)} miles</p>
                      <p>{weather.visibility >= 10000 ? 'Excellent' : weather.visibility >= 5000 ? 'Good' : weather.visibility >= 1000 ? 'Moderate' : 'Poor'}</p>
                    </div>
                  </div>
                </div>
              )}
              {airQuality.status === "success" && (
                <div 
                  className="weather-extra-details-box"
                  style={{ flex: '1 1 120px', cursor: 'pointer' }}
                  onClick={() => setFlippedCard(flippedCard === 'aqi' ? null : 'aqi')}
                >
                  <div className={`flip-card-inner ${flippedCard === 'aqi' ? 'flipped' : ''}`}>
                    <div className="flip-card-front">
                      <p className="card-icon">🌬️</p>
                      <p>Air Quality</p>
                      <p style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}><strong>{airQuality.data.aqi}</strong> ({airQuality.data.category})</p>
                    </div>
                    <div className="flip-card-back">
                      <p><strong>Air Quality</strong></p>
                      <p>AQI: {airQuality.data.aqi}</p>
                      <p style={{ fontSize: '0.85rem' }}>{airQuality.data.category}</p>
                      <p style={{ fontSize: '0.7rem', margin: '0.15rem 0' }}>
                        {airQuality.data.aqi <= 50 ? 'Satisfactory' : 
                         airQuality.data.aqi <= 100 ? 'Acceptable' : 
                         airQuality.data.aqi <= 150 ? 'Unhealthy (sensitive)' : 
                         airQuality.data.aqi <= 200 ? 'Unhealthy' : 
                         airQuality.data.aqi <= 300 ? 'Very Unhealthy' : 'Hazardous'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {username?.trim() && username !== "Guest" && (
          <div className="favorites-section fade-in" style={{ marginTop: 16 }}>
            <h3 onClick={() => setShowFavorites(!showFavorites)} style={{ cursor: "pointer" }}>
              Your Cities ({favoriteRecords.length}) {showFavorites ? "▼" : "►"}
            </h3>
            {showFavorites && (
              <div className="favorites-buttons">
                {favoriteRecords.length > 0 ? (
                  favoriteRecords
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
                          <button 
                            className="remove-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCityRecord(cityName);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                ) : (
                  <p style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic", padding: "1rem" }}>
                    No favorite cities yet. Search for a city and click the ★ button to add it!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {weather && <IssueReport user={username} city={weather.name} />}
      </div>
    </>
  );
}
