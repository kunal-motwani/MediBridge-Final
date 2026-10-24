Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "          MediBridge: Intelligent Healthcare Ecosystem" -ForegroundColor Yellow
Write-Host "  ABDM Zero-Trust Health Vault + Ambient Scribe + Diagnostic Copilot" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

Write-Host "[1/3] Starting Python Scribe Service on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\services\scribe'; python app.py serve"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Node.js Backend Server on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm start"

Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Vite Frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "All MediBridge services are starting up!" -ForegroundColor Yellow
Write-Host "- Web Portal:       http://localhost:5173" -ForegroundColor White
Write-Host "- Backend API:      http://localhost:5000/api/v1" -ForegroundColor White
Write-Host "- Ambient Scribe:   http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "Doctor:   doctor@demo.com  / password123" -ForegroundColor White
Write-Host "Patient:  patient@demo.com / password123 (Health ID: MB-2026-487139, PIN: 1234)" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
