import React, { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import axios from "axios";
import WeatherDashboard from "./components/WeatherDashboard";
import SearchBar from "./components/SearchBar";
import LandingPage from "./components/LandingPage";
import ChatBot from "./components/ChatBot";
import AuthModal from "./components/AuthModal";
import "./App.css";

import API from "./config";
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "AIzaSyBt-oVyBLUuz2IYFXn6iSynnAp39k29mrs";
const LIBRARIES = ["places"];

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0a0e1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0e1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ab4f8" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1a2744" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9aa0a6" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2744" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0d1526" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9aa0a6" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d2137" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e9af1" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0d1220" }] },
];

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("forecast_user");
    return u ? JSON.parse(u) : null;
  });
  const [markerPos, setMarkerPos] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [precautions, setPrecautions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const fetchWeather = useCallback(async (lat, lon) => {
    setLoading(true);
    setShowDashboard(false);
    try {
      const [curr, forecast, predict] = await Promise.all([
        axios.post(`${API}/weather/current`, { lat, lon }),
        axios.post(`${API}/forecast/5day`, { lat, lon }),
        axios.post(`${API}/forecast/predict`, { lat, lon }),
      ]);
      setWeatherData(curr.data);
      setForecastData(forecast.data);
      setPredictionData(predict.data);

      const prec = await axios.post(`${API}/precautions/`, {
        temp: curr.data.temp,
        humidity: curr.data.humidity,
        wind_speed: curr.data.wind_speed,
        pressure: curr.data.pressure,
        description: curr.data.description,
        location: curr.data.location,
      });
      setPrecautions(prec.data);
      setShowDashboard(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lon = e.latLng.lng();
    setMarkerPos({ lat, lng: lon });
    setMapCenter({ lat, lng: lon });
    fetchWeather(lat, lon);
  }, [fetchWeather]);

  const handleSearch = useCallback(({ lat, lon }) => {
    setMarkerPos({ lat, lng: lon });
    setMapCenter({ lat, lng: lon });
    if (mapRef.current) mapRef.current.panTo({ lat, lng: lon });
    fetchWeather(lat, lon);
  }, [fetchWeather]);

  if (!isLoaded) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="app">
      {showLanding && <LandingPage onEnter={() => setShowLanding(false)} onAuth={() => { setShowLanding(false); setShowAuth(true); }} />}

      <div className="navbar">
        <span className="navbar-title">FORECAST<span className="navbar-dot">.AI</span></span>
        <SearchBar onSearch={handleSearch} />
        <div className="navbar-auth">
          {user ? (
            <>
              <span className="navbar-user">👋 {user.name.split(" ")[0]}</span>
              <button className="navbar-logout" onClick={() => {
                localStorage.removeItem("forecast_token");
                localStorage.removeItem("forecast_user");
                setUser(null);
              }}>Sign out</button>
            </>
          ) : (
            <>
              <button className="navbar-login" onClick={() => setShowAuth(true)}>Sign in</button>
              <button className="navbar-signup" onClick={() => setShowAuth(true)}>Get started</button>
            </>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Fetching weather data...</p>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100vh" }}
        center={mapCenter}
        zoom={5}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
        onClick={onMapClick}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {markerPos && (
          <Marker
            position={markerPos}
            icon={weatherData ? {
              url: `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`,
              scaledSize: new window.google.maps.Size(60, 60),
              anchor: new window.google.maps.Point(30, 30),
            } : undefined}
          />
        )}
      </GoogleMap>

      {!loading && !showDashboard && !showLanding && (
        <div className="app-hint">Click anywhere on the map or search a city</div>
      )}

      {showDashboard && weatherData && (
        <WeatherDashboard
          weather={weatherData}
          forecast={forecastData}
          predictions={predictionData}
          precautions={precautions}
          onClose={() => setShowDashboard(false)}
          user={user}
        />
      )}

      <ChatBot weather={weatherData} />
    </div>
  );
}
