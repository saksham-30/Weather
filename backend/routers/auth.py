from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timedelta
import json, os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET = "forecast_ai_secret_2024"
ALGORITHM = "HS256"
DB_FILE = "users.json"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

def load_users():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE) as f:
        return json.load(f)

def save_users(users):
    with open(DB_FILE, "w") as f:
        json.dump(users, f, indent=2)

def make_token(email: str):
    exp = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": email, "exp": exp}, SECRET, algorithm=ALGORITHM)

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token

@router.post("/register")
def register(req: RegisterRequest):
    users = load_users()
    if req.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    users[req.email] = {
        "name": req.name,
        "email": req.email,
        "password": pwd_ctx.hash(req.password),
        "provider": "email",
    }
    save_users(users)
    return {"token": make_token(req.email), "name": req.name, "email": req.email}

@router.post("/login")
def login(req: LoginRequest):
    users = load_users()
    user = users.get(req.email)
    if not user or not pwd_ctx.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": make_token(req.email), "name": user["name"], "email": req.email}

@router.post("/google")
def google_auth(req: GoogleAuthRequest):
    try:
        info = id_token.verify_oauth2_token(
            req.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = info["email"]
        name = info.get("name", email.split("@")[0])
        picture = info.get("picture", "")

        users = load_users()
        if email not in users:
            users[email] = {
                "name": name,
                "email": email,
                "password": "",
                "provider": "google",
                "picture": picture,
            }
            save_users(users)

        return {"token": make_token(email), "name": name, "email": email, "picture": picture}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google auth failed: {str(e)}")
