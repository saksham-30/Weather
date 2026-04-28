import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import "./StatsCharts.css";

const COLORS = ["#4e9af1", "#4ecdc4", "#f6a623", "#e05c5c", "#a78bfa"];

export default function StatsCharts({ weather, forecast }) {
  const humidityData = [
    { name: "Humidity", value: weather.humidity },
    { name: "Dry Air", value: 100 - weather.humidity },
  ];

  const cloudData = [
    { name: "Clouds", value: weather.clouds },
    { name: "Clear", value: 100 - weather.clouds },
  ];

  const radarData = [
    { subject: "Humidity", value: weather.humidity },
    { subject: "Wind", value: Math.min(weather.wind_speed * 5, 100) },
    { subject: "Clouds", value: weather.clouds },
    { subject: "Pressure", value: Math.min(((weather.pressure - 950) / 100) * 100, 100) },
    { subject: "Visibility", value: Math.min(weather.visibility * 10, 100) },
  ];

  const areaData = (forecast || []).map(d => ({
    date: d.date.slice(5),
    max: d.temp_max,
    min: d.temp_min,
    humidity: d.humidity,
  }));

  return (
    <div className="stats-charts">
      <div className="charts-row">
        <div className="chart-box">
          <h4>Humidity</h4>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={humidityData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                {humidityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1a2744", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="chart-label">{weather.humidity}%</p>
        </div>

        <div className="chart-box">
          <h4>Cloud Cover</h4>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={cloudData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                {cloudData.map((_, i) => <Cell key={i} fill={[COLORS[2], COLORS[0]][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1a2744", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="chart-label">{weather.clouds}%</p>
        </div>
      </div>

      <div className="chart-box full">
        <h4>Weather Radar</h4>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1a2744" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#4a5a7a", fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fill: "#4a5a7a", fontSize: 9 }} />
            <Radar name="Conditions" dataKey="value" stroke="#4e9af1" fill="#4e9af1" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-box full">
        <h4>Temperature Area Chart</h4>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
            <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1a2744", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="max" name="Max °C" stroke="#f6a623" fill="url(#maxGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="min" name="Min °C" stroke="#4e9af1" fill="url(#minGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
