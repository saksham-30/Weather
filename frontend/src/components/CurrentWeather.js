import React from "react";
import { WiHumidity, WiStrongWind, WiBarometer, WiDaySunny } from "react-icons/wi";
import { FiEye, FiSunrise, FiSunset } from "react-icons/fi";
import "./CurrentWeather.css";

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CurrentWeather({ weather }) {
  return (
    <div className="current-weather">
      <div className="temp-hero">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
          alt={weather.description}
          className="weather-icon-large"
        />
        <div className="temp-info">
          <span className="temp-main">{Math.round(weather.temp)}°C</span>
          <span className="feels-like">Feels like {Math.round(weather.feels_like)}°C</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<WiHumidity />} label="Humidity" value={`${weather.humidity}%`} />
        <StatCard icon={<WiStrongWind />} label="Wind" value={`${weather.wind_speed} m/s`} />
        <StatCard icon={<WiBarometer />} label="Pressure" value={`${weather.pressure} hPa`} />
        <StatCard icon={<FiEye />} label="Visibility" value={`${weather.visibility} km`} />
        <StatCard icon={<WiDaySunny />} label="Cloud Cover" value={`${weather.clouds}%`} />
        <StatCard icon={<WiStrongWind />} label="Wind Dir" value={`${weather.wind_deg}°`} />
      </div>

      <div className="sun-times">
        <div className="sun-item">
          <FiSunrise className="sun-icon rise" />
          <span>Sunrise</span>
          <strong>{formatTime(weather.sunrise)}</strong>
        </div>
        <div className="sun-divider" />
        <div className="sun-item">
          <FiSunset className="sun-icon set" />
          <span>Sunset</span>
          <strong>{formatTime(weather.sunset)}</strong>
        </div>
      </div>
    </div>
  );
}
