import React from "react";

export default function UseMyLocation({ onWeatherFetched, setLoading, setErrorMessage, setNearestUsed }) {
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=e54b1a91b15cfa9a227758fc1e6b5c27&units=metric`
          );
          const data = await res.json();

          if (data?.name) {
            onWeatherFetched(data.name); // ✅ Pass city back to Weather.js
            if (typeof setNearestUsed === "function") setNearestUsed(true); // ✅ Tell Weather.js we used location
          } else {
            setErrorMessage("Could not detect nearby city.");
          }
        } catch {
          setErrorMessage("Failed to fetch location data.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === 1) setErrorMessage("Permission denied for location.");
        else setErrorMessage("Unable to retrieve location.");
      }
    );
  };

  return (
    <button onClick={handleUseMyLocation}>
      Use My Location
    </button>
  );
}
