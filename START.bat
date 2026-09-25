@echo off
REM AdPulse - double-click to start the dashboard
cd /d "%~dp0"

echo ============================================
echo   AdPulse - Paid Ads Dashboard
echo ============================================
echo.

if not exist .env (
    echo Creating .env from .env.example ...
    copy .env.example .env >nul
    echo Add your ad platform API keys to .env later - sample data works without them.
    echo.
)

if not exist node_modules (
    echo First run: installing dependencies, this takes a minute...
    call npm run setup
    if errorlevel 1 goto :failed
)

if not exist data\ads.db (
    echo Loading sample data...
    call npm run seed
    if errorlevel 1 goto :failed
)

echo.
echo Opening http://localhost:5173 ...  (close this window to stop)
echo.
start "" /b cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"
call npm run dev
goto :eof

:failed
echo.
echo Something went wrong above. Make sure Node.js 22.13 or newer is installed.
pause
