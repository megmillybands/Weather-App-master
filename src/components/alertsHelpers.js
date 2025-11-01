export const getAlertStyle = (alertType) => {
  if (!alertType) return null;
  const lower = alertType.toLowerCase();

  if (lower.includes("tornado")) {
    return { title: "Tornado Warning", description: "Take shelter immediately.", icon: "🌪️" };
  }
  if (lower.includes("thunder")) {
    return { title: "Severe Thunderstorm", description: "Strong winds and lightning expected.", icon: "⚡" };
  }
  if (lower.includes("rain")) {
    return { title: "Heavy Rain Alert", description: "Expect heavy rainfall in your area.", icon: "🌧️" };
  }
  if (lower.includes("snow")) {
    return { title: "Winter Storm Advisory", description: "Snow expected. Travel may be hazardous.", icon: "❄️" };
  }
  if (lower.includes("sleet") || lower.includes("hail")) {
    return { title: "Sleet/Hail Hazard", description: "Icy conditions possible. Drive cautiously.", icon: "🌨️" };
  }
  if (lower.includes("flood")) {
    return { title: "Flood Warning", description: "Flooding likely. Avoid low areas.", icon: "🌊" };
  }
  if (lower.includes("heat") || lower.includes("uv")) {
    return { title: "High Heat/UV Advisory", description: "Stay hydrated and avoid direct sunlight.", icon: "☀️" };
  }

  return null; // ✅ No alert for normal conditions
};