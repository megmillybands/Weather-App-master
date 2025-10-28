import React, { useState, useEffect, useCallback } from "react";

const BASE_URL = "https://unit-4-project-app-24d5eea30b23.herokuapp.com";
const TEAM_ID = 3; // Your assigned team ID

export default function Favorites({ username, setUsername, setCity }) {
  const [favorites, setFavorites] = useState([]);
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputUsername, setInputUsername] = useState(username);

  // Fetch user’s saved favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/get/all?teamId=${TEAM_ID}`);
      const data = await response.json();

      const userFavorites = data.response.filter(
        (item) => item.body.type === "favorite" && item.body.user === username
      );

      setFavorites(userFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // ✅ Load favorites for this user
  useEffect(() => {
    fetchFavorites();
  }, [username, fetchFavorites]);



  // ✅ Add a favorite city
  async function addFavorite() {
    if (!newCity.trim() || !username.trim()) return;

    try {
      const response = await fetch(`${BASE_URL}/post/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: TEAM_ID,
          body: {
            type: "favorite",
            user: username,
            city: newCity.trim(),
          },
        }),
      });

      const result = await response.json();
      console.log("Added favorite:", result);
      setNewCity("");
      fetchFavorites();
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  }

  // ✅ Delete a favorite
  async function deleteFavorite(id) {
    try {
      await fetch(`${BASE_URL}/delete/data`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, team: TEAM_ID }),
      });

      setFavorites(favorites.filter((fav) => fav.id !== id));
    } catch (error) {
      console.error("Error deleting favorite:", error);
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
            onKeyDown={(e) => e.key === "Enter" && setUsername(inputUsername.trim())}
          />
          <button onClick={() => setUsername(inputUsername.trim())}>
            Save Name
          </button>
        </div>
      ) : (
        <>
          <div className="add-favorite">
            <input
              type="text"
              placeholder="Add a city"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
            />
            <button onClick={addFavorite}>Add</button>
          </div>

          {loading ? (
            <p>Loading favorites...</p>
          ) : favorites.length > 0 ? (
            <ul>
              {favorites.map((fav) => (
                <li key={fav.id} onClick={() => setCity(fav.body.city)}>
                  {fav.body.city}
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
