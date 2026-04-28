import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./AuthModal.css";

import API from "../config";

export default function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleInitRef = useRef(false);

  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const persist = (data) => {
    const userData = { name: data.name, email: data.email, picture: data.picture || "" };
    localStorage.setItem("forecast_user", JSON.stringify(userData));
    onAuth(userData);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const res = await axios.post(`${API}${endpoint}`, payload);
      persist(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "register" || !GOOGLE_CLIENT_ID || typeof window === "undefined") return;

    const loadGoogleIdentity = async () => {
      if (!window.google?.accounts?.id) {
        await new Promise((resolve, reject) => {
          const existingScript = document.querySelector('script[data-google-identity="true"]');
          if (existingScript) {
            existingScript.addEventListener("load", resolve, { once: true });
            existingScript.addEventListener("error", reject, { once: true });
            return;
          }

          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.dataset.googleIdentity = "true";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (!googleInitRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              setError("");
              setLoading(true);
              const res = await axios.post(`${API}/auth/google`, { credential: response.credential });
              persist(res.data);
            } catch (err) {
              setError(err.response?.data?.detail || "Google sign-in failed");
            } finally {
              setLoading(false);
            }
          },
        });
        googleInitRef.current = true;
      }
    };

    loadGoogleIdentity().catch(() => {
      setError("Google sign-in could not be loaded right now.");
    });
  }, [mode, GOOGLE_CLIENT_ID]);

  const startGoogleSignIn = async () => {
    setError("");

    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured yet.");
      return;
    }

    try {
      if (!window.google?.accounts?.id) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (!googleInitRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              setLoading(true);
              const res = await axios.post(`${API}/auth/google`, { credential: response.credential });
              persist(res.data);
            } catch (err) {
              setError(err.response?.data?.detail || "Google sign-in failed");
            } finally {
              setLoading(false);
            }
          },
        });
        googleInitRef.current = true;
      }

      window.google.accounts.id.prompt();
    } catch {
      setError("Google sign-in could not be started.");
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-left">
          <div className="auth-brand">FORECAST<span>.AI</span></div>
          <p>Your personal weather intelligence platform. Know what's coming before it arrives.</p>
          <div className="auth-features">
            <div>Live weather for any location</div>
            <div>Charts and ML forecasts</div>
            <div>AI-powered precautions</div>
            <div>Downloadable PDF reports</div>
          </div>
        </div>

        <div className="auth-right">
          <button className="auth-close" onClick={onClose}>✕</button>
          <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="auth-sub">{mode === "login" ? "Sign in to your account" : "Start for free"}</p>

          <form onSubmit={submit}>
            {mode === "register" && (
              <div className="auth-field">
                <label>Full Name</label>
                <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handle} required />
              </div>
            )}
            <div className="auth-field">
              <label>Email</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
            </div>
            {error && <div className="auth-error">{error}</div>}

            {mode === "register" && (
              <>
                <div className="auth-divider"><span>or</span></div>
                <button
                  type="button"
                  className="google-signin-btn"
                  onClick={startGoogleSignIn}
                  disabled={loading}
                >
                  <span className="google-badge">G</span>
                  Continue with Google
                </button>
              </>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login" ? (
              <>Don't have an account? <span onClick={() => { setMode("register"); setError(""); }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => { setMode("login"); setError(""); }}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
