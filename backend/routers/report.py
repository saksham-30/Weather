from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import json, os, tempfile, requests
from datetime import datetime

router = APIRouter()
DB_FILE = "search_history.json"
N8N_WEBHOOK = os.getenv("N8N_WEBHOOK_URL", "")

def load_history():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE) as f:
        return json.load(f)

def save_history(history):
    with open(DB_FILE, "w") as f:
        json.dump(history, f, indent=2)

class ReportRequest(BaseModel):
    user_email: str
    user_name: str
    weather: dict
    forecast: list = []
    precautions: dict = {}

def generate_pdf(req: ReportRequest, filepath: str):
    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", fontSize=22, fontName="Helvetica-Bold",
                                  textColor=colors.HexColor("#1a1a2e"), spaceAfter=4, alignment=TA_LEFT)
    sub_style = ParagraphStyle("sub", fontSize=11, fontName="Helvetica",
                                textColor=colors.HexColor("#666666"), spaceAfter=16)
    section_style = ParagraphStyle("section", fontSize=13, fontName="Helvetica-Bold",
                                    textColor=colors.HexColor("#6366f1"), spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle("body", fontSize=10, fontName="Helvetica",
                                 textColor=colors.HexColor("#333333"), spaceAfter=4, leading=16)

    w = req.weather
    story = []

    # Header
    story.append(Paragraph("FORECAST.AI", ParagraphStyle("brand", fontSize=10, fontName="Helvetica-Bold",
                             textColor=colors.HexColor("#6366f1"))))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Weather Intelligence Report", title_style))
    story.append(Paragraph(f"{w.get('location', 'Unknown')}, {w.get('country', '')}  ·  {datetime.now().strftime('%B %d, %Y')}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 12))

    # Prepared for
    story.append(Paragraph("Prepared for", ParagraphStyle("label", fontSize=9, fontName="Helvetica",
                             textColor=colors.HexColor("#999999"))))
    story.append(Paragraph(f"{req.user_name}  ·  {req.user_email}", body_style))
    story.append(Spacer(1, 16))

    # Current conditions
    story.append(Paragraph("Current Conditions", section_style))
    cond_data = [
        ["Parameter", "Value"],
        ["Temperature", f"{w.get('temp', '?')}°C (feels like {w.get('feels_like', '?')}°C)"],
        ["Conditions", str(w.get('description', '?')).title()],
        ["Humidity", f"{w.get('humidity', '?')}%"],
        ["Wind Speed", f"{w.get('wind_speed', '?')} m/s"],
        ["Pressure", f"{w.get('pressure', '?')} hPa"],
        ["Visibility", f"{w.get('visibility', '?')} km"],
        ["Cloud Cover", f"{w.get('clouds', '?')}%"],
    ]
    t = Table(cond_data, colWidths=[6*cm, 10*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#6366f1")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f9fafb"), colors.white]),
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ("PADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))

    # 5-day forecast
    if req.forecast:
        story.append(Paragraph("5-Day Forecast", section_style))
        fc_data = [["Date", "Max °C", "Min °C", "Humidity", "Wind", "Conditions"]]
        for d in req.forecast[:5]:
            fc_data.append([
                d.get("date", ""),
                str(d.get("temp_max", "")),
                str(d.get("temp_min", "")),
                f"{d.get('humidity', '')}%",
                f"{d.get('wind', '')} m/s",
                str(d.get("description", "")).title(),
            ])
        ft = Table(fc_data, colWidths=[3*cm, 2.2*cm, 2.2*cm, 2.5*cm, 2.5*cm, 4.6*cm])
        ft.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 9),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f9fafb"), colors.white]),
            ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING", (0,0), (-1,-1), 7),
        ]))
        story.append(ft)
        story.append(Spacer(1, 16))

    # Precautions
    if req.precautions:
        story.append(Paragraph("AI Precautions & Advisories", section_style))
        labels = {
            "farmers": "For Farmers",
            "business": "For Businesses",
            "residents": "For Residents",
            "riverside": "Riverside Areas",
            "heat_alert": "Heat Alerts",
        }
        for key, label in labels.items():
            items = req.precautions.get(key, [])
            if items:
                story.append(Paragraph(label, ParagraphStyle("cat", fontSize=10, fontName="Helvetica-Bold",
                                         textColor=colors.HexColor("#374151"), spaceBefore=8, spaceAfter=4)))
                for item in items:
                    story.append(Paragraph(f"• {item}", body_style))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Generated by FORECAST.AI · Weather Intelligence Platform",
                             ParagraphStyle("footer", fontSize=8, fontName="Helvetica",
                                            textColor=colors.HexColor("#aaaaaa"), alignment=TA_CENTER)))

    doc.build(story)

@router.post("/generate")
def generate_report(req: ReportRequest):
    # Save to search history
    history = load_history()
    history.append({
        "email": req.user_email,
        "name": req.user_name,
        "location": req.weather.get("location", ""),
        "country": req.weather.get("country", ""),
        "timestamp": datetime.now().isoformat(),
        "weather": req.weather,
    })
    save_history(history)

    # Generate PDF
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf", prefix="forecast_")
    generate_pdf(req, tmp.name)

    # Trigger n8n webhook if configured
    if N8N_WEBHOOK:
        try:
            requests.post(N8N_WEBHOOK, json={
                "email": req.user_email,
                "name": req.user_name,
                "location": req.weather.get("location", ""),
                "pdf_path": tmp.name,
                "timestamp": datetime.now().isoformat(),
            }, timeout=5)
        except Exception:
            pass

    return FileResponse(
        tmp.name,
        media_type="application/pdf",
        filename=f"forecast_{req.weather.get('location', 'report').replace(' ', '_')}.pdf",
        headers={"Access-Control-Expose-Headers": "Content-Disposition"}
    )

@router.get("/history")
def get_history():
    return load_history()
