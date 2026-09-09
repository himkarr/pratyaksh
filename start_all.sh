#!/bin/bash

echo "========================================================"
echo "Starting MPLAD Sapphire Decision Support System..."
echo "========================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$ROOT_DIR/.venv"

# --------------------------------------------------------
# Check Python
# --------------------------------------------------------

if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: Python 3 is not installed."
    exit 1
fi

# --------------------------------------------------------
# Create Linux virtual environment if required
# --------------------------------------------------------

if [ ! -f "$VENV/bin/activate" ]; then
    echo "Linux virtual environment not found."
    echo "Creating Linux virtual environment..."

    python3 -m venv "$VENV"

    if [ $? -ne 0 ]; then
        echo
        echo "ERROR: Could not create virtual environment."
        echo
        echo "On Ubuntu/Debian install:"
        echo "  sudo apt install python3-venv"
        exit 1
    fi
fi

source "$VENV/bin/activate"

# --------------------------------------------------------
# Check required directories
# --------------------------------------------------------

for DIR in ai-ml backend frontend; do
    if [ ! -d "$ROOT_DIR/$DIR" ]; then
        echo "ERROR: Directory not found:"
        echo "$ROOT_DIR/$DIR"
        exit 1
    fi
done

# --------------------------------------------------------
# Install Python dependencies
# --------------------------------------------------------

if [ -f "$ROOT_DIR/requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip install -r "$ROOT_DIR/requirements.txt"
elif [ -f "$ROOT_DIR/backend/requirements.txt" ]; then
    echo "Installing backend dependencies..."
    pip install -r "$ROOT_DIR/backend/requirements.txt"
    
    if [ -f "$ROOT_DIR/ai-ml/requirements.txt" ]; then
        echo "Installing AI-ML dependencies..."
        pip install -r "$ROOT_DIR/ai-ml/requirements.txt"
    fi
fi

# --------------------------------------------------------
# Check Node.js / npm
# --------------------------------------------------------

if ! command -v npm >/dev/null 2>&1; then
    echo
    echo "ERROR: npm is not installed."
    echo "Install Node.js and npm before starting the frontend."
    exit 1
fi

# --------------------------------------------------------
# Start AI-ML service
# --------------------------------------------------------

echo
echo "[1/3] Starting AI-ML Inference Service (Port 8001)..."

cd "$ROOT_DIR/ai-ml"

nohup "$VENV/bin/python" -m uvicorn \
    service.ml_api:app \
    --host 127.0.0.1 \
    --port 8001 \
    --reload \
    > "$ROOT_DIR/ai-ml.log" 2>&1 &

AI_PID=$!

echo "AI-ML PID: $AI_PID"

# --------------------------------------------------------
# Start Backend
# --------------------------------------------------------

echo
echo "[2/3] Starting Backend API Gateway (Port 8000)..."

cd "$ROOT_DIR/backend"

nohup "$VENV/bin/python" -m uvicorn \
    app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --reload \
    > "$ROOT_DIR/backend.log" 2>&1 &

BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"

# --------------------------------------------------------
# Start Frontend
# --------------------------------------------------------

echo
echo "[3/3] Starting Frontend Vite Dev Server (Port 5173)..."

cd "$ROOT_DIR/frontend"

nohup npm run dev \
    > "$ROOT_DIR/frontend.log" 2>&1 &

FRONTEND_PID=$!

echo "Frontend PID: $FRONTEND_PID"

# --------------------------------------------------------
# Wait for services
# --------------------------------------------------------

echo
echo "========================================================"
echo "Services are starting..."
echo "========================================================"

sleep 5

echo
echo "Checking services..."

# AI-ML
if curl -sf http://127.0.0.1:8001/health >/dev/null 2>&1; then
    echo "✓ AI-ML Service: RUNNING"
    echo "  http://127.0.0.1:8001/health"
else
    echo "✗ AI-ML Service: FAILED"
    echo "  Check: ai-ml.log"
fi

# Backend
if curl -sf http://127.0.0.1:8000/docs >/dev/null 2>&1; then
    echo "✓ Backend API:   RUNNING"
    echo "  http://127.0.0.1:8000/docs"
else
    echo "✗ Backend API:   FAILED"
    echo "  Check: backend.log"
fi

# Frontend
if curl -sf http://127.0.0.1:5173 >/dev/null 2>&1; then
    echo "✓ Frontend UI:   RUNNING"
    echo "  http://localhost:5173"
else
    echo "✗ Frontend UI:   FAILED"
    echo "  Check: frontend.log"
fi

echo
echo "========================================================"
echo "MPLAD Sapphire Startup Complete"
echo "========================================================"

echo
echo "Process IDs:"
echo "  AI-ML:   $AI_PID"
echo "  Backend: $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"

echo
echo "Logs:"
echo "  AI-ML:    $ROOT_DIR/ai-ml.log"
echo "  Backend:  $ROOT_DIR/backend.log"
echo "  Frontend: $ROOT_DIR/frontend.log"
echo "========================================================"