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
          const geoRes = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&limit=1`
          );

          let locationName = "Your Location";
          let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          let nearestCity = null;

          if (geoRes.data.results.length > 0) {
            const result = geoRes.data.results[0];
            const components = result.components;

            nearestCity =
              components.city ||
              components.town ||
              components.village;

            // Build a complete location name with address, city, and zip
            const parts = [];
            if (components.road) {
              parts.push(components.road);
            }
            if (nearestCity) {
              parts.push(nearestCity);
            }
            if (components.state) {
              parts.push(components.state);
            }
            if (components.postcode) {
              parts.push(components.postcode);
            }

            // Join all parts with commas
            locationName = parts.join(', ');

            timezone = result.annotations.timezone.name;
          }

          // Pass location info back to Weather.js
          // Always set nearestUsed to true for location button to show informative message
          onWeatherFetched(null, {
            coordinates: { latitude, longitude },
            locationName,
            useExactLocation: true,
            timezone,
            nearestCity,
            nearestUsed: true, // Always true to show the informative message
          });
        } catch (error) {
          console.error("Error fetching location:", error);
          setErrorMessage(
            "⚠️ Couldn't find your exact location — showing the nearest city instead."
          );

          // No city found → fallback message only
          onWeatherFetched(null, {
            city: "Nearest City",
            nearestUsed: true,
            error:
              "📍 Unable to detect your city. Showing the closest available location.",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrorMessage(
          "📍 Unable to retrieve your location. Please enter a city manually."
        );
        onWeatherFetched(null, {
          city: "Nearest City",
          nearestUsed: true,
        });
        setLoading(false);
      }
    );
  };

  return (
    <div>
      <button
        onClick={fetchLocation}
        style={{
          padding: "8px 16px",
          backgroundColor: "rgba(0, 123, 255, 0.8)",
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
