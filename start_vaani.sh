#!/bin/bash
echo "🚀 Starting Vaani OS..."

# Kill any existing processes on these ports to prevent errors
lsof -ti:3000,8000 | xargs kill -9 2>/dev/null

# 1. Start Redis Server in background
echo "📦 Starting Database (Redis)..."
redis-server > /dev/null 2>&1 &

# 2. Activate Python environment
source venv/bin/activate

# 3. Start AI Backend in background
echo "🧠 Starting AI Core (FastAPI)..."
uvicorn app.main:app --reload --port 8000 > /dev/null 2>&1 &

# 4. Start Background Worker (Celery)
echo "⚙️ Starting Background Task Manager (Celery)..."
celery -A app.tasks.celery_app worker --loglevel=error > /dev/null 2>&1 &

# 5. Start the beautiful Frontend
echo "💻 Starting Frontend Dashboard..."
cd frontend
npm run dev
