import React, { useState } from "react";
import "./App.css";
import Weather from "./components/Weather";
import Favorites from "./components/Favorites";

function App() {
  const [city, setCity] = useState("New York"); // Default city
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Weather App</h1>
      </header>
      <Weather city={city} setCity={setCity} username={username} />
      <Favorites username={username} setUsername={setUsername} setCity={setCity} />
    </div>
  );
}

export default App;