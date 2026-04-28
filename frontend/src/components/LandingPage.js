import React, { useEffect, useState } from "react";
import "./LandingPage.css";

const FEATURES = [
  { label: "Live Weather", desc: "Real-time data from OpenWeatherMap for any location on earth" },
  { label: "AI Advisory", desc: "Gemini-powered precautions tailored for farmers, businesses and residents" },
  { label: "ML Forecast", desc: "Scikit-learn regression model predicts temperature trends ahead" },
  { label: "Visual Analytics", desc: "Bar, area, radar and pie charts for deep weather insight" },
];

export default function LandingPage({ onEnter, onAuth }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(onEnter, 700);
  };

  return (
    <div className={`landing ${visible ? "visible" : ""} ${leaving ? "leaving" : ""}`}>

      <div className="noise" />

      <nav className="landing-nav">
        <span className="landing-logo">FORECAST<span className="logo-dot">.AI</span></span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="nav-btn" onClick={onAuth}>Sign in</button>
          <button className="nav-btn" style={{ background: "#6366f1", borderColor: "#6366f1", color: "#fff" }} onClick={onAuth}>Get started</button>
        </div>
      </nav>

      <div className="landing-hero">
        <p className="hero-eyebrow">Weather Intelligence Platform</p>
        <h1 className="hero-title">
          Know what's coming<br />
          <span className="hero-accent">before it arrives.</span>
        </h1>
        <p className="hero-sub">
          Click anywhere on the map. Get live weather, AI-generated precautions
          for your community, and machine learning forecasts — instantly.
        </p>
        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={handleEnter}>
            Launch Map
          </button>
          <span className="hero-note">No sign-up required</span>
        </div>
      </div>

      <div className="features-row">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-item" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            <span className="feature-num">0{i + 1}</span>
            <strong>{f.label}</strong>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="landing-gradient-bar" />
    </div>
  );
}
