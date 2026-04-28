import React, { useState } from "react";
import axios from "axios";
import CurrentWeather from "./CurrentWeather";
import ForecastChart from "./ForecastChart";
import PrecautionCards from "./PrecautionCards";
import StatsCharts from "./StatsCharts";
import PredictionGrid from "./PredictionGrid";
import { FiX, FiCloud, FiBarChart2, FiShield, FiTrendingUp, FiDownload, FiGrid } from "react-icons/fi";
import "./WeatherDashboard.css";

import API from "../config";

const TABS = [
  { id: "current",    label: "Current",    icon: <FiCloud /> },
  { id: "forecast",   label: "Forecast",   icon: <FiBarChart2 /> },
  { id: "predict",    label: "Predict",    icon: <FiGrid /> },
  { id: "stats",      label: "Stats",      icon: <FiTrendingUp /> },
  { id: "precautions",label: "Precautions",icon: <FiShield /> },
];

export default function WeatherDashboard({ weather, forecast, predictions, precautions, onClose, user }) {
  const [tab, setTab] = useState("current");
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!user) {
      alert("Please sign in to download reports.");
      return;
    }
    setDownloading(true);
    try {
      const res = await axios.post(`${API}/report/generate`, {
        user_email: user.email,
        user_name: user.name,
        weather,
        forecast: forecast || [],
        precautions: precautions || {},
      }, { responseType: "blob" });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `forecast_${weather.location}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to generate report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="location-title">
          <span className="loc-name">{weather.location}, {weather.country}</span>
          <span className="loc-desc">{weather.description}</span>
        </div>
        <div className="header-actions">
          <button className="pdf-btn" onClick={downloadPDF} disabled={downloading} title="Download PDF Report">
            <FiDownload /> {downloading ? "..." : "PDF"}
          </button>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
      </div>

      <div className="dashboard-tabs">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="dashboard-body">
        {tab === "current" && <CurrentWeather weather={weather} />}
        {tab === "forecast" && <ForecastChart forecast={forecast} predictions={predictions} />}
        {tab === "predict" && <PredictionGrid predictions={predictions} location={weather.location} />}
        {tab === "stats" && <StatsCharts weather={weather} forecast={forecast} />}
        {tab === "precautions" && <PrecautionCards precautions={precautions} weather={weather} />}
      </div>
    </div>
  );
}
