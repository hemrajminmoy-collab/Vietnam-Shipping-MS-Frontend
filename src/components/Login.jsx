import React, { useState } from "react";
import "./Login.css";
import bgVideo from "../assets/media.mp4"; // background video

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "admin123") {
      onLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      {/* 🎥 Background Video */}
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* 🌑 Overlay */}
      <div className="overlay"></div>

      {/* 🧊 Glass Login Card */}
      <div className="login-container">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Vietnam Trading</h2>
          <p className="subtitle">Sign in to continue</p>

          {error && <p className="error">{error}</p>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>

          <div className="hint">
            {/* <p>Username: <b>admin</b></p>
            <p>Password: <b>admin123</b></p> */}
          </div>
        </form>
      </div>
    </div>
  );
}
