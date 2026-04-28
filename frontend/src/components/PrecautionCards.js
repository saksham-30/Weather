import React, { useState } from "react";
import axios from "axios";
import { GiFarmer } from "react-icons/gi";
import { FiBriefcase, FiUsers, FiDroplet, FiThermometer } from "react-icons/fi";
import "./PrecautionCards.css";

import API from "../config";

const CATEGORIES = [
  { key: "farmers",    label: { en: "Farmers",    mr: "शेतकरी"   }, icon: <GiFarmer />,      color: "#4ecdc4" },
  { key: "business",   label: { en: "Business",   mr: "व्यवसाय"  }, icon: <FiBriefcase />,   color: "#f6a623" },
  { key: "residents",  label: { en: "Residents",  mr: "रहिवासी"  }, icon: <FiUsers />,       color: "#4e9af1" },
  { key: "riverside",  label: { en: "Riverside",  mr: "नदीकाठ"   }, icon: <FiDroplet />,     color: "#a78bfa" },
  { key: "heat_alert", label: { en: "Heat Alert", mr: "उष्णता"   }, icon: <FiThermometer />, color: "#e05c5c" },
];

export default function PrecautionCards({ precautions: initialPrecautions, weather }) {
  const [active, setActive] = useState("farmers");
  const [lang, setLang] = useState("en");
  const [precautions, setPrecautions] = useState(initialPrecautions);
  const [loading, setLoading] = useState(false);

  const switchLang = async (newLang) => {
    if (newLang === lang) return;
    setLang(newLang);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/precautions/`, {
        temp: weather.temp,
        humidity: weather.humidity,
        wind_speed: weather.wind_speed,
        pressure: weather.pressure,
        description: weather.description,
        location: weather.location,
        lang: newLang,
      });
      setPrecautions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!precautions) return <p style={{ color: "#4a5a7a" }}>Loading precautions...</p>;

  const current = CATEGORIES.find(c => c.key === active);
  const items = precautions[active] || [];

  return (
    <div className="precaution-cards">
      <div className="prec-top-bar">
        <div className="weather-summary-bar">
          <span>{Math.round(weather.temp)}°C</span>
          <span>{weather.humidity}%</span>
          <span>{weather.wind_speed} m/s</span>
          <span>{weather.pressure} hPa</span>
        </div>
        <div className="lang-toggle">
          <button className={lang === "en" ? "active" : ""} onClick={() => switchLang("en")}>EN</button>
          <button className={lang === "mr" ? "active" : ""} onClick={() => switchLang("mr")}>मर</button>
        </div>
      </div>

      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={active === cat.key ? "active" : ""}
            style={active === cat.key ? { borderColor: cat.color, color: cat.color } : {}}
            onClick={() => setActive(cat.key)}
          >
            {cat.icon} {cat.label[lang]}
          </button>
        ))}
      </div>

      <div className="precaution-list">
        <div className="prec-header" style={{ color: current.color }}>
          <span className="prec-icon">{current.icon}</span>
          <span>{current.label[lang]} {lang === "mr" ? "सल्ला" : "Advisory"}</span>
        </div>
        {loading ? (
          <p className="no-alert">{lang === "mr" ? "लोड होत आहे..." : "Loading..."}</p>
        ) : items.length === 0 ? (
          <p className="no-alert">{lang === "mr" ? "या विभागासाठी कोणताही इशारा नाही." : "No alerts for this category."}</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="prec-item" style={{ borderLeftColor: current.color }}>
              <span className="prec-num">{i + 1}</span>
              <p>{item}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
