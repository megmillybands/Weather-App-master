// src/components/AuthBox.js
import React, { useState } from "react";
import "../App.css";

export default function AuthBox({ setAuthUser }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const hashPassword = (pwd) => btoa(pwd.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users") || "{}");

    if (isSignup) {
      if (storedUsers[username]) {
        setError("That username already exists.");
        return;
      }
      storedUsers[username] = { password: hashPassword(password) };
      localStorage.setItem("users", JSON.stringify(storedUsers));
      setAuthUser({ username });
    } else {
      const existingUser = storedUsers[username];
      if (!existingUser) {
        setError("User not found. Please sign up.");
        return;
      }
      if (existingUser.password !== hashPassword(password)) {
        setError("Incorrect password. Try again.");
        return;
      }
      setAuthUser({ username });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass">
        <h2>{isSignup ? "Create an Account" : "Welcome Back"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
        </form>
        <p>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <span
            className="auth-toggle"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}