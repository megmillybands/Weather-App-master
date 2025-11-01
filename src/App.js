// src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import Weather from "./components/Weather";
import Favorites from "./components/Favorites";
import AuthBox from "./components/AuthBox";

function App() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem("authUser");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (authUser) {
      localStorage.setItem("authUser", JSON.stringify(authUser));
    } else {
      localStorage.removeItem("authUser");
    }
  }, [authUser]);

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    setAuthUser(null);
  };

  if (!authUser) {
    return (
      <div className="App">
        <div className="background-overlay"></div>
        <AuthBox setAuthUser={setAuthUser} />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="background-overlay"></div>
      <header className="App-header">
        <h1>Weather App</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <Weather
        city={city}
        setCity={setCity}
        state={state}
        setState={setState}
        username={authUser.username}
      />
      <Favorites username={authUser.username} setCity={setCity} />
    </div>
  );
}

export default App;