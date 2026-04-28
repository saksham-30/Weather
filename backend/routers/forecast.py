from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("OPENWEATHER_API_KEY")

class LocationRequest(BaseModel):
    lat: float
    lon: float

@router.post("/5day")
def get_5day_forecast(req: LocationRequest):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={req.lat}&lon={req.lon}&appid={API_KEY}&units=metric"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()

        daily = {}
        for item in data["list"]:
            date = item["dt_txt"].split(" ")[0]
            if date not in daily:
                daily[date] = {
                    "temps": [], "humidity": [], "wind": [],
                    "pressure": [], "rain": [],
                    "description": item["weather"][0]["description"],
                    "icon": item["weather"][0]["icon"]
                }
            daily[date]["temps"].append(item["main"]["temp"])
            daily[date]["humidity"].append(item["main"]["humidity"])
            daily[date]["wind"].append(item["wind"]["speed"])
            daily[date]["pressure"].append(item["main"]["pressure"])
            daily[date]["rain"].append(item.get("rain", {}).get("3h", 0))

        result = []
        for date, vals in daily.items():
            result.append({
                "date": date,
                "temp_max": round(max(vals["temps"]), 1),
                "temp_min": round(min(vals["temps"]), 1),
                "temp_avg": round(sum(vals["temps"]) / len(vals["temps"]), 1),
                "humidity": round(sum(vals["humidity"]) / len(vals["humidity"]), 1),
                "wind": round(sum(vals["wind"]) / len(vals["wind"]), 1),
                "pressure": round(sum(vals["pressure"]) / len(vals["pressure"]), 1),
                "rain": round(sum(vals["rain"]), 2),
                "description": vals["description"],
                "icon": vals["icon"],
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def fetch_historical(lat: float, lon: float, days: int = 30) -> pd.DataFrame:
    """Fetch historical daily data from Open-Meteo (free, no key needed)."""
    end = datetime.now().date()
    start = end - timedelta(days=days)
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start}&end_date={end}"
        f"&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
        f"precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean,pressure_msl_mean"
        f"&timezone=auto"
    )
    res = requests.get(url, timeout=15)
    res.raise_for_status()
    d = res.json()["daily"]
    df = pd.DataFrame({
        "date": pd.to_datetime(d["time"]),
        "temp_max": d["temperature_2m_max"],
        "temp_min": d["temperature_2m_min"],
        "temp_mean": d["temperature_2m_mean"],
        "precip": d["precipitation_sum"],
        "wind": d["windspeed_10m_max"],
        "humidity": d.get("relative_humidity_2m_mean", [None]*len(d["time"])),
        "pressure": d.get("pressure_msl_mean", [None]*len(d["time"])),
    })
    df = df.fillna(method="ffill").fillna(method="bfill")
    return df


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add lag features and rolling stats for ML."""
    df = df.copy().reset_index(drop=True)
    for lag in [1, 2, 3, 7]:
        df[f"temp_mean_lag{lag}"] = df["temp_mean"].shift(lag)
        df[f"precip_lag{lag}"] = df["precip"].shift(lag)
        df[f"humidity_lag{lag}"] = df["humidity"].shift(lag)
    df["temp_roll7"] = df["temp_mean"].rolling(7).mean()
    df["temp_roll3"] = df["temp_mean"].rolling(3).mean()
    df["precip_roll7"] = df["precip"].rolling(7).sum()
    df["day_of_year"] = df["date"].dt.dayofyear
    df["month"] = df["date"].dt.month
    return df.dropna()


def train_and_predict(df: pd.DataFrame, horizon: int = 5) -> list:
    """Train GradientBoosting models and predict next `horizon` days."""
    df = build_features(df)

    feature_cols = [c for c in df.columns if c not in ["date", "temp_max", "temp_min", "temp_mean", "precip", "wind", "humidity", "pressure"]]
    targets = {
        "temp_max": df["temp_max"],
        "temp_min": df["temp_min"],
        "temp_mean": df["temp_mean"],
        "precip": df["precip"],
        "wind": df["wind"],
        "humidity": df["humidity"],
    }

    X = df[feature_cols].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    models = {}
    for target, y in targets.items():
        m = GradientBoostingRegressor(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42)
        m.fit(X_scaled, y.values)
        models[target] = m

    # Build future feature rows by rolling forward
    last_row = df.iloc[-1].copy()
    predictions = []

    for i in range(horizon):
        future_date = last_row["date"] + timedelta(days=1)
        row = {
            "date": future_date,
            "temp_mean_lag1": last_row["temp_mean"],
            "temp_mean_lag2": df.iloc[-2]["temp_mean"] if len(df) > 1 else last_row["temp_mean"],
            "temp_mean_lag3": df.iloc[-3]["temp_mean"] if len(df) > 2 else last_row["temp_mean"],
            "temp_mean_lag7": df.iloc[-7]["temp_mean"] if len(df) > 6 else last_row["temp_mean"],
            "precip_lag1": last_row["precip"],
            "precip_lag2": df.iloc[-2]["precip"] if len(df) > 1 else last_row["precip"],
            "precip_lag3": df.iloc[-3]["precip"] if len(df) > 2 else last_row["precip"],
            "precip_lag7": df.iloc[-7]["precip"] if len(df) > 6 else last_row["precip"],
            "humidity_lag1": last_row["humidity"],
            "humidity_lag2": df.iloc[-2]["humidity"] if len(df) > 1 else last_row["humidity"],
            "humidity_lag3": df.iloc[-3]["humidity"] if len(df) > 2 else last_row["humidity"],
            "humidity_lag7": df.iloc[-7]["humidity"] if len(df) > 6 else last_row["humidity"],
            "temp_roll7": df["temp_mean"].iloc[-7:].mean(),
            "temp_roll3": df["temp_mean"].iloc[-3:].mean(),
            "precip_roll7": df["precip"].iloc[-7:].sum(),
            "day_of_year": future_date.timetuple().tm_yday,
            "month": future_date.month,
        }

        X_future = scaler.transform([[row[c] for c in feature_cols]])
        pred = {t: float(m.predict(X_future)[0]) for t, m in models.items()}

        rain_prob = min(100, max(0, int((pred["precip"] / 20) * 100)))

        predictions.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "temp_max": round(pred["temp_max"], 1),
            "temp_min": round(pred["temp_min"], 1),
            "temp_avg": round(pred["temp_mean"], 1),
            "humidity": round(max(0, min(100, pred["humidity"])), 1),
            "wind": round(max(0, pred["wind"]), 1),
            "precip_mm": round(max(0, pred["precip"]), 2),
            "rain_probability": rain_prob,
            "condition": (
                "Heavy Rain" if pred["precip"] > 10 else
                "Light Rain" if pred["precip"] > 2 else
                "Cloudy" if pred["humidity"] > 80 else
                "Partly Cloudy" if pred["humidity"] > 60 else
                "Sunny"
            ),
        })

        # Roll the dataframe forward with predicted values
        new_row = pd.DataFrame([{
            "date": future_date,
            "temp_max": pred["temp_max"],
            "temp_min": pred["temp_min"],
            "temp_mean": pred["temp_mean"],
            "precip": max(0, pred["precip"]),
            "wind": max(0, pred["wind"]),
            "humidity": pred["humidity"],
            "pressure": last_row["pressure"],
        }])
        df = pd.concat([df, new_row], ignore_index=True)
        df = build_features(df)
        last_row = df.iloc[-1].copy()

    return predictions


@router.post("/predict")
def predict_weather(req: LocationRequest):
    try:
        df = fetch_historical(req.lat, req.lon, days=30)
        predictions = train_and_predict(df, horizon=5)
        return {"predictions": predictions, "model": "GradientBoostingRegressor", "features": 18}
    except Exception as e:
        # Fallback to simple linear regression if historical fetch fails
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={req.lat}&lon={req.lon}&appid={API_KEY}&units=metric"
        res = requests.get(url, timeout=10)
        data = res.json()
        temps = [item["main"]["temp"] for item in data["list"]]
        X = np.array(range(len(temps))).reshape(-1, 1)
        from sklearn.linear_model import LinearRegression
        model = LinearRegression().fit(X, temps)
        preds = []
        for i in range(5):
            future_idx = len(temps) + i * 8
            t = float(model.predict([[future_idx]])[0])
            preds.append({
                "date": (datetime.now() + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                "temp_max": round(t + 2, 1),
                "temp_min": round(t - 2, 1),
                "temp_avg": round(t, 1),
                "humidity": 60,
                "wind": 5.0,
                "precip_mm": 0,
                "rain_probability": 10,
                "condition": "Partly Cloudy",
            })
        return {"predictions": preds, "model": "LinearRegression (fallback)", "features": 1}
