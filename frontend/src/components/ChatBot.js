import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatBot.css";

import API from "../config";

const QUICK_PROMPTS = [
  "Should I go outside today?",
  "What should I wear?",
  "Is it safe to drive?",
  "Good day for a run?",
];

const WELCOME = {
  role: "model",
  text: "Hey! I'm Skye ☁️ your weather buddy.\nTell me what's on your mind — going out, planning something, or just curious about the weather?",
};

export default function ChatBot({ weather }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  // Pulse the button when weather loads
  useEffect(() => {
    if (weather) {
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
    }
  }, [weather]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", text: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role === "model" ? "model" : "user",
        text: m.text,
      }));

      const res = await axios.post(`${API}/chat/`, {
        message: msg,
        weather: weather || {},
        history: history.slice(0, -1),
      });

      setMessages(prev => [...prev, { role: "model", text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "model",
        text: "Oops, lost signal there 📡 Try again in a sec!",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`chat-fab ${open ? "open" : ""} ${pulse ? "pulse" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open weather chat"
      >
        {open ? "✕" : "☁"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-avatar">S</div>
            <div>
              <div className="chatbot-name">Skye</div>
              <div className="chatbot-status">
                <span className="status-dot" />
                {weather ? `${weather.location} · ${Math.round(weather.temp)}°C` : "Select a location"}
              </div>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === "user" ? "user" : "bot"}`}>
                {m.role === "model" && <div className="bot-avatar">S</div>}
                <div className="msg-bubble">
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="bot-avatar">S</div>
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="quick-prompts">
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => send(q)} disabled={loading}>{q}</button>
            ))}
          </div>

          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Skye anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
