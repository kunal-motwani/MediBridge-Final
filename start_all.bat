@echo off
title MediBridge 2.0 - Platform Launcher
color 0b

echo =====================================================================
echo           MediBridge: Intelligent Healthcare Ecosystem
echo   ABDM Zero-Trust Health Vault + Ambient Scribe + Diagnostic Copilot
echo =====================================================================
echo.

REM 1. Start Scribe Service
echo [1/3] Launching Ambient Scribe (FastAPI on Port 8000)...
start "MediBridge Ambient Scribe (Port 8000)" cmd /k "cd services\scribe && python app.py serve"
timeout /t 2 /nobreak >nul

REM 2. Start Backend Server
echo [2/3] Launching Express Server (Port 5000)...
start "MediBridge Node Backend (Port 5000)" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul

REM 3. Start Frontend
echo [3/3] Launching Vite Client (Port 5173)...
start "MediBridge Vite Client (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo =====================================================================
echo All services launched!
echo - Web Portal:         http://localhost:5173
echo - Backend API:        http://localhost:5000/api/v1
echo - AI Scribe Engine:   http://localhost:8000
echo.
echo Doctor Login:   doctor@demo.com   / password123
echo Patient Login:  patient@demo.com  / password123 (PIN: 1234)
echo =====================================================================
echo.
pause
