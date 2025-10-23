import React, { useState, useEffect } from "react"
import axios from "axios";
import WeatherAlert from "../WeatherAlert";

function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);

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

  useEffect(() => {
  const savedFavorites = localStorage.getItem("favoriteCities");
  if (savedFavorites) {
    setFavorites(JSON.parse(savedFavorites));
  }
}, []);
useEffect(() => {
  localStorage.setItem("favoriteCities", JSON.stringify(favorites));
}, [favorites]);

  const getWeather = async (cityName = city) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
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

const addToFavorites = () => {
  if (weather && !favorites.includes(weather.name)) {
    setFavorites([...favorites, weather.name]);
  }
};

const removeFromFavorites = (cityName) => {
  setFavorites(favorites.filter(fav => fav !== cityName));
};

const isFavorite = weather && favorites.includes(weather.name);

const updateBackground = (weatherMain) => {
  const overlay = document.querySelector(".background-overlay");
  if (!overlay) return;

  let gradient = "";

  switch (weatherMain.toLowerCase()) {
    case "clear":
      gradient = "linear-gradient(-45deg, #f6d365, #fda085, #fbc2eb, #a6c1ee)";
      break;
    case "clouds":
      gradient = "linear-gradient(-45deg, #bdc3c7, #2c3e50, #757f9a, #d7dde8)";
      break;
    case "rain":
      gradient = "linear-gradient(-45deg, #4e54c8, #8f94fb, #667db6, #0082c8)";
      break;
    case "thunderstorm":
      gradient = "linear-gradient(-45deg, #141E30, #243B55, #232526, #414345)";
      break;
    case "snow":
      gradient = "linear-gradient(-45deg, #e0eafc, #cfdef3, #f8fbff, #e2ebf0)";
      break;
    case "drizzle":
      gradient = "linear-gradient(-45deg, #89f7fe, #66a6ff, #a1c4fd, #c2e9fb)";
      break;
    case "mist":
    case "fog":
      gradient = "linear-gradient(-45deg, #757f9a, #d7dde8, #bdc3c7, #2c3e50)";
      break;
    case "haze":
      gradient = "linear-gradient(-45deg, #ffecd2, #fcb69f, #f6d365, #fda085)";
      break;
    case "smoke":
      gradient = "linear-gradient(-45deg, #434343, #000000, #232526, #414345)";
      break;
    case "dust":
    case "sand":
      gradient = "linear-gradient(-45deg, #eacda3, #d6ae7b, #cbb4d4, #20002c)";
      break;
    default:
      gradient = "linear-gradient(-45deg, #89f7fe, #66a6ff, #a1c4fd, #c2e9fb)";
  }

  overlay.style.transition = "opacity 1.5s ease-in-out, background 1.5s ease-in-out";
  overlay.style.animation = "none";
  overlay.style.opacity = 0;

  setTimeout(() => {
    overlay.style.background = gradient;
    overlay.style.backgroundSize = "400% 400%";
    overlay.style.animation = "gradientMove 15s ease infinite";
    overlay.style.opacity = 1;
  }, 500);
};


  return (
    <>
      <div className="background-overlay"></div>
      <div className="weather-container">
        <h2>Check the Weather</h2>
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
           onKeyPress={(e) => e.key === 'Enter' && getWeather()}
        />
        <button onClick={getWeather}>Search</button>
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
            <p>
              🌡️ {weather.main.temp}°C (
              {(weather.main.temp * 9 / 5 + 32).toFixed(1)}°F)
            </p>
            <p>☁️ {weather.weather[0].description}</p>
            <p>💨 Wind: {weather.wind.speed} m/s</p>
            <button 
  onClick={addToFavorites} 
  disabled={isFavorite}
  className="favorite-btn"
>
  {isFavorite ? "⭐ Saved" : "☆ Save to Favorites"}
</button>
          </div>
        )}
{favorites.length > 0 && (
  <div className="favorites-section">
    <h3>Favorite Cities</h3>
    <div className="favorites-list">
      {favorites.map((fav) => (
        <div key={fav} className="favorite-item">
          <span onClick={() => getWeather(fav)} style={{cursor: 'pointer'}}>
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