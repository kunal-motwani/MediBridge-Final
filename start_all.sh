#!/usr/bin/env bash

echo "====================================================================="
echo "          MediBridge: Intelligent Healthcare Ecosystem"
echo "  ABDM Zero-Trust Health Vault + Ambient Scribe + Diagnostic Copilot"
echo "====================================================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/3] Starting Python Scribe Service on port 8000..."
(cd "$ROOT_DIR/services/scribe" && python3 app.py serve) &
SCRIBE_PID=$!

sleep 2

echo "[2/3] Starting Node.js Backend Server on port 5000..."
(cd "$ROOT_DIR/server" && npm start) &
SERVER_PID=$!

sleep 3

echo "[3/3] Starting Vite Frontend on port 5173..."
(cd "$ROOT_DIR/client" && npm run dev) &
CLIENT_PID=$!

echo ""
echo "====================================================================="
echo "All MediBridge services are running!"
echo "- Web Portal:       http://localhost:5173"
echo "- Backend API:      http://localhost:5000/api/v1"
echo "- Ambient Scribe:   http://localhost:8000"
echo ""
echo "Demo Credentials:"
echo "Doctor:   doctor@demo.com  / password123"
echo "Patient:  patient@demo.com / password123 (PIN: 1234)"
echo "====================================================================="

trap "kill $SCRIBE_PID $SERVER_PID $CLIENT_PID" EXIT
wait
