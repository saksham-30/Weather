from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
# Initialize GenAI client only if API key is provided to avoid import-time failures
_client = None
_gemini_api_key = os.getenv("GEMINI_CHAT_API_KEY")
if _gemini_api_key:
    try:
        _client = genai.Client(api_key=_gemini_api_key)
    except Exception:
        _client = None

class ChatRequest(BaseModel):
    message: str
    weather: dict = {}
    history: list = []

SYSTEM_PROMPT = """You are Skye — a witty, warm, and slightly sarcastic AI weather buddy built into a weather app called FORECAST.AI.

Your personality:
- You're like that one friend who actually checks the weather before going out
- Casual, fun, uses emojis naturally (not overdone)
- Short punchy replies — never more than 3-4 sentences
- You give real, useful advice but make it feel like a text from a friend
- Light humor is your thing, but you're never annoying about it
- You know the current weather data and use it to give hyper-relevant advice

Rules:
- Never say "As an AI..." or "I'm a language model..."
- Never give long boring paragraphs
- Always tie your answer back to the current weather when relevant
- If someone asks something unrelated to weather, gently steer back with humor
- Use line breaks to keep things readable"""

def build_weather_context(weather: dict) -> str:
    if not weather:
        return "No weather data yet — user hasn't selected a location."
    return (
        f"Current weather at {weather.get('location', '?')}, {weather.get('country', '')}: "
        f"{weather.get('temp', '?')}°C (feels like {weather.get('feels_like', '?')}°C), "
        f"{weather.get('description', '?')}, humidity {weather.get('humidity', '?')}%, "
        f"wind {weather.get('wind_speed', '?')} m/s, visibility {weather.get('visibility', '?')} km."
    )

@router.post("/")
def chat(req: ChatRequest):
    weather_ctx = build_weather_context(req.weather)

    # Build contents list for multi-turn conversation
    contents = []
    for msg in req.history[-8:]:
        role = "model" if msg.get("role") == "model" else "user"
        contents.append(types.Content(
            role=role,
            parts=[types.Part(text=msg["text"])]
        ))

    # Inject weather context into the user message
    user_text = f"{req.message}\n\n[Weather context: {weather_ctx}]"
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=user_text)]
    ))

    try:
        response = _client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.85,
                max_output_tokens=200,
            )
        )
        return {"reply": response.text.strip()}
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return {"reply": "Whoa, too many questions at once! 😅 Give me 30 seconds to catch my breath and try again ☁️"}
        return {"reply": f"Oops, lost signal there 📡 Try again in a sec!"}
