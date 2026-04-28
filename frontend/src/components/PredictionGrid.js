import React from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from "recharts";
import "./PredictionGrid.css";

const CONDITION_META = {
  "Heavy Rain":    { icon: "🌧️", color: "#4e9af1", bg: "rgba(78,154,241,0.1)" },
  "Light Rain":    { icon: "🌦️", color: "#4ecdc4", bg: "rgba(78,205,196,0.1)" },
  "Cloudy":        { icon: "☁️",  color: "#8ab4f8", bg: "rgba(138,180,248,0.08)" },
  "Partly Cloudy": { icon: "⛅",  color: "#f6a623", bg: "rgba(246,166,35,0.08)" },
  "Sunny":         { icon: "☀️",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1526", border: "1px solid #1a2744", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontFamily: "DM Sans, sans-serif" }}>
      <p style={{ color: "#8ab4f8", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function PredictionGrid({ predictions, location }) {
  if (!predictions?.predictions?.length) {
    return <p style={{ color: "#4a5a7a", fontFamily: "DM Sans", fontSize: "0.85rem", padding: "20px 0" }}>No prediction data available. Select a location on the map first.</p>;
  }

  const preds = predictions.predictions;
  const allMax = Math.max(...preds.map(p => p.temp_max));
  const allMin = Math.min(...preds.map(p => p.temp_min));
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const chartData = preds.map(d => ({
    date: d.date.slice(5),
    max: d.temp_max,
    min: d.temp_min,
    avg: d.temp_avg,
    humidity: d.humidity,
    wind: d.wind,
    rain: d.rain_probability,
    precip: d.precip_mm,
  }));

  return (
    <div className="pg-wrapper">
      {/* Header */}
      <div className="pg-header">
        <div className="pg-title-block">
          <span className="pg-eyebrow">ML Model · {predictions.model} · 30-day training data</span>
          <h3 className="pg-title">Next 5 Days — {location}</h3>
        </div>
      </div>

      {/* Cards */}
      <div className="pg-grid-scroll">
        <div className="pg-grid">
          {preds.map((d, i) => {
            const meta = CONDITION_META[d.condition] || CONDITION_META["Partly Cloudy"];
            const date = new Date(d.date + "T00:00:00");
            const dayName = i === 0 ? "Tomorrow" : days[date.getDay()];
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const range = allMax - allMin || 1;
            const barLeft = ((d.temp_min - allMin) / range) * 100;
            const barWidth = ((d.temp_max - d.temp_min) / range) * 100;

            return (
              <div key={i} className="pg-card" style={{ borderTopColor: meta.color, background: meta.bg }}>
                <div className="pg-card-top">
                  <div className="pg-day-info">
                    <span className="pg-day-name">{dayName}</span>
                    <span className="pg-date-str">{dateStr}</span>
                  </div>
                  <span className="pg-cond-icon">{meta.icon}</span>
                </div>
                <div className="pg-condition" style={{ color: meta.color }}>{d.condition}</div>
                <div className="pg-temp-main">
                  <span className="pg-temp-max">{d.temp_max}°</span>
                  <span className="pg-temp-sep">/</span>
                  <span className="pg-temp-min">{d.temp_min}°</span>
                </div>
                {/* Temp range bar */}
                <div className="pg-temp-track">
                  <div className="pg-temp-bar-wrap">
                    <div className="pg-temp-fill" style={{ left: `${barLeft}%`, width: `${barWidth}%` }} />
                  </div>
                </div>
                <div className="pg-stats-row">
                  <div className="pg-stat"><span>💧</span><span className="pg-stat-val">{d.humidity}%</span><span className="pg-stat-lbl">Humidity</span></div>
                  <div className="pg-stat"><span>💨</span><span className="pg-stat-val">{d.wind}</span><span className="pg-stat-lbl">m/s</span></div>
                  <div className="pg-stat"><span>🌧</span><span className="pg-stat-val">{d.precip_mm}mm</span><span className="pg-stat-lbl">Rain</span></div>
                </div>
                {/* Rain probability bar */}
                <div className="pg-rain-section">
                  <span className="pg-rain-title">Rain chance</span>
                  <div className="pg-rain-track">
                    <div className="pg-rain-fill" style={{ width: `${d.rain_probability}%`, background: d.rain_probability > 60 ? "#4e9af1" : d.rain_probability > 30 ? "#4ecdc4" : "#2a3a5c" }} />
                    <span className="pg-rain-label">{d.rain_probability}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <p className="pg-chart-title">Predicted Temperature (°C)</p>
      <ResponsiveContainer width="100%" height={170}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="pgMaxG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f6a623" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f6a623" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pgMinG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4e9af1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4e9af1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="max" name="Max °C" stroke="#f6a623" fill="url(#pgMaxG)" strokeWidth={2} />
          <Area type="monotone" dataKey="min" name="Min °C" stroke="#4e9af1" fill="url(#pgMinG)" strokeWidth={2} />
          <Line type="monotone" dataKey="avg" name="Avg °C" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>

      <p className="pg-chart-title">Rain Probability & Humidity</p>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="rain" name="Rain %" fill="#4e9af1" opacity={0.7} radius={[4,4,0,0]} />
          <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="#4ecdc4" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="pg-chart-title">Wind Speed (m/s)</p>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="wind" name="Wind m/s" fill="#a78bfa" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
