@echo off
echo ========================================================
echo Starting MPLAD Sapphire Decision Support System...
echo ========================================================

echo [1/3] Starting AI-ML Inference Service (Port 8001)...
start "MPLADS - AI-ML Service (Port 8001)" cmd /k "cd /d "%~dp0ai-ml" && "%~dp0.venv\Scripts\activate" && uvicorn service.ml_api:app --host 127.0.0.1 --port 8001 --reload"

echo [2/3] Starting Backend API Gateway (Port 8000)...
start "MPLADS - Backend API (Port 8000)" cmd /k "cd /d "%~dp0backend" && "%~dp0.venv\Scripts\activate" && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Starting Frontend Vite Dev Server (Port 5173)...
start "MPLADS - Frontend Dashboard (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo All 3 services have been launched in separate terminals!
echo - AI-ML Service:  http://127.0.0.1:8001/health
echo - Backend API:    http://127.0.0.1:8000/docs
echo - Frontend UI:    http://localhost:5173
echo ========================================================
