import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
  AreaChart, Area, ComposedChart
} from "recharts";
import "./ForecastChart.css";

const CONDITION_ICON = {
  "Heavy Rain": "🌧️",
  "Light Rain": "🌦️",
  "Cloudy": "☁️",
  "Partly Cloudy": "⛅",
  "Sunny": "☀️",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tt-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function ForecastChart({ forecast, predictions }) {
  const forecastData = (forecast || []).map(d => ({
    date: d.date.slice(5),
    max: d.temp_max,
    min: d.temp_min,
    avg: d.temp_avg,
    humidity: d.humidity,
    wind: d.wind,
    rain: d.rain || 0,
    description: d.description,
    icon: d.icon,
  }));

  return (
    <div className="forecast-chart">

      {/* ── 5-Day cards row ── */}
      <div className="fc-day-cards">
        {forecastData.map((d, i) => (
          <div key={i} className="fc-day-card">
            <span className="fc-day-label">{i === 0 ? "Today" : d.date}</span>
            <img
              src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
              alt={d.description}
              className="fc-day-icon"
            />
            <span className="fc-day-desc">{d.description}</span>
            <div className="fc-day-temps">
              <span className="fc-day-max">{d.max}°</span>
              <span className="fc-day-min">{d.min}°</span>
            </div>
            <div className="fc-day-meta">
              <span>💧{d.humidity}%</span>
              <span>💨{d.wind}m/s</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Temperature bar chart ── */}
      <p className="fc-section-title">Temperature Range (°C)</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#4a5a7a" }} />
          <Bar dataKey="max" name="Max °C" fill="#f6a623" radius={[4,4,0,0]} />
          <Bar dataKey="min" name="Min °C" fill="#4e9af1" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* ── Humidity & Wind line chart ── */}
      <p className="fc-section-title">Humidity & Wind Trend</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="#4ecdc4" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="wind" name="Wind m/s" stroke="#f6a623" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* ── Temperature area chart ── */}
      <p className="fc-section-title">Temperature Area</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f6a623" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f6a623" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4e9af1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4e9af1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="max" name="Max °C" stroke="#f6a623" fill="url(#maxGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="min" name="Min °C" stroke="#4e9af1" fill="url(#minGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}
