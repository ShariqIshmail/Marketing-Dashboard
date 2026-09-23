@echo off
REM Marketing Dashboard - Quick Start Script

echo ============================================
echo Marketing Dashboard Launcher
echo ============================================
echo.
echo Starting all services...
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and fill in your values.
    pause
    exit /b 1
)

REM Start Backend
echo [1/3] Starting Backend (Node/Express) on http://localhost:5000...
start "Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment
timeout /t 2 /nobreak

REM Start Frontend
echo [2/3] Starting Frontend (React) on http://localhost:3000...
start "Frontend" cmd /k "cd frontend && npm start"

REM Wait a moment
timeout /t 2 /nobreak

REM Start Agent Service
echo [3/3] Starting Agent Service (Python/CrewAI) on http://localhost:5001...
start "Agents" cmd /k "cd agents && python main.py"

echo.
echo ============================================
echo All services starting...
echo ============================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo Agents:   http://localhost:5001
echo.
echo Close these windows to stop services.
echo.
pause
