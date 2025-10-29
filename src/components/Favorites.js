// src/components/favorites.js
import React, { useState, useEffect, useCallback } from "react";

const BASE_URL = "https://unit-4-project-app-24d5eea30b23.herokuapp.com";
const TEAM_ID = 3;

export default function Favorites({ username, setUsername, setCity }) {
  const [favorites, setFavorites] = useState([]);
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputUsername, setInputUsername] = useState(username ?? "");
  const [error, setError] = useState("");

  const fetchFavorites = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/get/all?teamId=${TEAM_ID}`);
      const data = await res.json();
      const all = Array.isArray(data?.response) ? data.response : [];
      const mine = all.filter(
        (item) =>
          item?.body?.type === "favorite" &&
          String(item?.body?.user || "").toLowerCase() ===
            String(username).toLowerCase() &&
          item?.body?.favorite === true
      );
      setFavorites(mine);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Could not load favorites.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchFavorites();
  }, [username, fetchFavorites]);

async function addFavorite() {
  setError("");
  if (!newCity.trim() || !username?.trim()) return;
  try {
    const res = await fetch(`${BASE_URL}/post/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: TEAM_ID, // ✅ FIXED: was "team"
        body: {
          type: "favorite",
          user: username,
          name: newCity.trim(),
          favorite: true,
        },
      }),
    });

const result = await res.json();
console.log("Favorite POST result:", result);

// handle both formats the backend might send
const saved = result?.response ?? result;
if (!saved) throw new Error("No response body");

setNewCity("");
fetchFavorites();
  } catch (err) {
    console.error("Error adding favorite:", err);
    setError("Failed to add favorite.");
  }
}

  async function deleteFavorite(id) {
    setError("");
    try {
      await fetch(`${BASE_URL}/post/data/${id}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Error deleting favorite:", err);
      setError("Failed to delete favorite.");
    }
  }

  return (
    <div className="favorites">
      <h2>⭐ Favorite Cities</h2>

      {!username ? (
        <div className="username-setup">
          <input
            type="text"
            placeholder="Enter your name to see favorites"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && setUsername(inputUsername.trim())
            }
          />
          <button onClick={() => setUsername(inputUsername.trim())}>Save Name</button>
        </div>
      ) : (
        <>
          <div className="add-favorite">
            <input
              type="text"
              placeholder="Add a city"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFavorite()}
            />
            <button onClick={addFavorite}>Add</button>
          </div>

          {loading ? (
            <p>Loading favorites...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : favorites.length > 0 ? (
            <ul>
              {favorites.map((fav) => (
                <li key={fav.id} onClick={() => setCity(fav.body.name)}>
                  {fav.body.name}
                  <button onClick={() => deleteFavorite(fav.id)}>❌</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No favorites saved yet.</p>
          )}
        </>
      )}
    </div>
  );
}