// src/App.js
import React from "react";
import "./App.css";
import Weather from "./components/Weather";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Weather App</h1>
      </header>

      <Weather />
    </div>
  );
}

export default App;