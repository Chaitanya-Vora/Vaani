# Vaani OS ⚡

> **Your AI Intern, One Message Away.**

Vaani OS is a deeply integrated, highly-opinionated autonomous agent designed to run the operational backbone of scaling agencies and consultancies right from WhatsApp. 

Unlike passive chatbots, Vaani is an active agent. It replaces manual data entry by extracting natural language into actionable business workflows—from automatic lead capture to proactive deadline reminders.

---

## 🚀 Core Capabilities

1. **The "I Promise" Tracker:** Make a commitment via a Voice Note (e.g., *"I'll send the quote tomorrow at 2 PM"*). Vaani actively tracks the deadline using Celery observers and natively pings you on WhatsApp the next day to ensure the task is fulfilled.
2. **Instant Contact Scanner:** Snap a photo of a business card. The multimodal vision pipeline instantly parses the image, grabs the Name, Number, and Company, and injects it directly into your CRM.
3. **Voice-to-Document Builder:** Transcribes unstructured, roaming thoughts into beautifully formatted Notion pages with clear Executive Summaries and Action Items.
4. **Contextual Intent Engine:** Communicate naturally in English or Hindi. The pipeline natively understands the context and routes the data to the correct accounting software, calendar, or database with zero user-side configuration limits.

## 🛠️ Architecture

*   **Frontend Command Center:** Next.js 14, TailwindCSS, Framer Motion, Recharts
*   **AI Backend Engine:** FastAPI (Python), Uvicorn
*   **Active Observers:** Celery, Redis
*   **Models:** Google Gemini 2.0 Flash-Lite (Vision & Intent), OpenAI Whisper (Transcription)
*   **Database:** PostgreSQL (AsyncPG)
*   **Platform Cloud:** Meta Developer API (WhatsApp)

---

## 💻 Quick Start Guide

You don't need to manually configure 5 different terminals to run the Vaani stack. 

### 1. Configure your Environment Variables
Duplicate the `.env.example` file into `.env` and populate your API keys (Google, OpenAI, WhatsApp Webhooks).
*Note: You do not need Notion/Calendar API keys in the `.env` file since Vaani natively handles OAuth integrations on a per-user basis.*

### 2. Boot the Entire Platform (One-Click)
Start your local Database, Background Worker, AI Backend, and Next.js Frontend all at the same time:

```bash
chmod +x start_vaani.sh
./start_vaani.sh
```

### 3. Open the Dashboard
Visit [http://localhost:3000](http://localhost:3000) to view your Command Center. If you are doing a demo, send a picture of a business card or a voice note to your configured WhatsApp Business Number to see the real-time processing logs appear in the dashboard instantly.

---

*Engineered for massive operational leverage.*
