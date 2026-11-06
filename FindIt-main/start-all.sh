#!/usr/bin/env bash
echo "========================================================"
echo "  FindIt Platform Launcher (Sylhet City Network)"
echo "========================================================"

# Start backend
echo "[1/3] Starting Express Backend API (:5000)..."
(cd backend && npm run dev) &

sleep 2

# Start AI Service
echo "[2/3] Starting FastAPI AI Microservice (:8001)..."
if [ -f "ai-service/.venv/bin/python" ]; then
  (cd ai-service && .venv/bin/python main.py) &
elif [ -f "ai-service/.venv/Scripts/python.exe" ]; then
  (cd ai-service && .venv/Scripts/python.exe main.py) &
elif command -v python3 &>/dev/null; then
  (cd ai-service && python3 main.py) &
else
  (cd ai-service && python main.py) &
fi

sleep 2

# Start Frontend
echo "[3/3] Starting Next.js Frontend (:3000)..."
(cd frontend && npm run dev) &

echo "All services started! Press Ctrl+C to terminate."
wait
