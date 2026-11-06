@echo off
title FindIt - Multimodal Lost and Found System Launcher
echo ========================================================
echo   FindIt Platform Launcher (Sylhet City Network)
echo ========================================================
echo.

cd /d "%~dp0"
if not exist "backend" if exist "FindIt-main\backend" cd FindIt-main

echo [1/3] Starting Express Backend API (Port 5000)...
start "FindIt - Backend API (:5000)" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/3] Starting FastAPI AI Microservice (Port 8001)...
if exist "ai-service\.venv\Scripts\python.exe" (
  start "FindIt - AI Service (:8001)" cmd /k "cd ai-service && .venv\Scripts\python.exe main.py"
) else (
  start "FindIt - AI Service (:8001)" cmd /k "cd ai-service && python main.py"
)

timeout /t 2 /nobreak >nul

echo [3/3] Starting Next.js Frontend (Port 3000)...
start "FindIt - Frontend (:3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   All 3 services have been launched in separate windows!
echo   - Frontend:   http://localhost:3000
echo   - Backend:    http://localhost:5000/api
echo   - AI Service: http://localhost:8001/docs
echo ========================================================
echo.
pause
