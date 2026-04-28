from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
import os as _os

# Load .env located in the backend folder explicitly
load_dotenv(_os.path.join(_os.path.dirname(__file__), '..', '.env'))

router = APIRouter()
API_KEY = os.getenv("OPENWEATHER_API_KEY")

class LocationRequest(BaseModel):
    lat: float
    lon: float

@router.post("/current")
def get_current_weather(req: LocationRequest):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={req.lat}&lon={req.lon}&appid={API_KEY}&units=metric"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        return {
            "temp": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": data["wind"]["speed"],
            "wind_deg": data["wind"]["deg"],
            "description": data["weather"][0]["description"],
            "icon": data["weather"][0]["icon"],
            "location": data["name"],
            "country": data["sys"]["country"],
            "clouds": data["clouds"]["all"],
            "visibility": data.get("visibility", 0) / 1000,
            "sunrise": data["sys"]["sunrise"],
            "sunset": data["sys"]["sunset"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/historical")
def get_historical(req: LocationRequest):
    # Using Open-Meteo for free historical data (last 7 days)
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={req.lat}&longitude={req.lon}&start_date=2024-04-17&end_date=2024-04-24&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        return {
            "dates": data["daily"]["time"],
            "temp_max": data["daily"]["temperature_2m_max"],
            "temp_min": data["daily"]["temperature_2m_min"],
            "precipitation": data["daily"]["precipitation_sum"],
            "wind_speed": data["daily"]["windspeed_10m_max"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
