#!/bin/bash

# Exit on first failure
set -e

echo "==================================================="
echo "🚀 Launching FinOps Portal Services (DB, BE, FE)"
echo "==================================================="

# 1. Start Database Container
echo "[1/3] Starting database container..."
cd db
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker Desktop/Daemon first."
    exit 1
fi
docker compose up -d
cd ..

# Give PostgreSQL a moment to wake up
echo "Waiting 5 seconds for database to initialize..."
sleep 5

# 2. Start Backend Server
echo "[2/3] Launching backend server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "[INFO] node_modules not found in backend. Installing dependencies..."
    npm install
fi
npm run db:generate
npm run dev &
BACKEND_PID=$!
cd ..

# 3. Start Frontend Development Server
echo "[3/3] Launching frontend server..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "[INFO] node_modules not found in frontend. Installing dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================================="
echo "🎉 All services running in the background!"
echo " - Backend PID:  $BACKEND_PID"
echo " - Frontend PID: $FRONTEND_PID"
echo " - Frontend UI:  http://localhost:5173"
echo " - Backend API:  http://localhost:3001"
echo "==================================================="
echo "Press Ctrl+C to stop all services..."

# Clean up background tasks on script termination (Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping background processes (PIDs: $BACKEND_PID, $FRONTEND_PID)..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "Stopping database container..."
    cd db && docker compose down && cd ..
    echo "All services stopped."
    exit 0
}

trap cleanup INT TERM

# Wait for background jobs to finish (which they won't unless interrupted)
wait
