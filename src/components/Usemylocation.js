import React from "react";
import axios from "axios";

const OPENCAGE_API_KEY = "0365e1e9244f4f1d85b5f5e2e4a3b8bd";
export default function UseMyLocation({
  onWeatherFetched,
  setLoading,
  setErrorMessage,
}) {
  const fetchLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenCage API to get nearest city
          const res = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&limit=1`
          );

          if (res.data.results.length > 0) {
            const result = res.data.results[0];
            const components = result.components;

            const state = components.state || "";
            const country = components.country || "";

            onWeatherFetched(null, {
              city: result.formatted,
              state,
              country,
              nearestUsed: true,
              timezone: result.annotations.timezone.name,
            });
          } else {
            setErrorMessage("Unable to detect location. Please enter city manually.");
            onWeatherFetched(null, { city: "Water Valley", nearestUsed: true });
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          setErrorMessage("Failed to fetch location data. Please try again later.");
          onWeatherFetched(null, { city: "Water Valley", nearestUsed: true });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrorMessage("Unable to retrieve location. Please enter city manually.");
        onWeatherFetched(null, { city: "Water Valley", nearestUsed: true });
        setLoading(false);
      }
    );
  };

  return (
    <div style={{ marginTop: "12px" }}>
      <button
        onClick={fetchLocation}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        📍 Use My Location
      </button>
    </div>
  );
}
