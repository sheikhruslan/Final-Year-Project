@echo off
REM Quick Start Script for Hong Kong Insurance Fraud Detection System
REM This script sets up and runs both backend and frontend servers

echo =========================================
echo Hong Kong Insurance Fraud Detection System
echo Quick Start Setup
echo =========================================
echo.

REM Check Python
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9 or higher from https://www.python.org/
    pause
    exit /b 1
)
echo Python found!

REM Check Node
echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16 or higher from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found!

REM Setup Backend
echo [3/6] Setting up Python backend...
cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -q -r requirements.txt

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
)

echo Generating synthetic test data...
python utils\data_generator.py

cd ..

REM Setup Frontend
echo [4/6] Setting up React frontend...
cd frontend

if not exist node_modules (
    echo Installing Node dependencies (this may take a few minutes)...
    call npm install
)

cd ..

echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo [5/6] Starting Backend Server...
echo Backend will run at: http://localhost:8000
echo API Docs at: http://localhost:8000/api/docs
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak >nul

echo [6/6] Starting Frontend Server...
echo Frontend will run at: http://localhost:3000
echo.

REM Start frontend in new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo =========================================
echo SYSTEM STARTED!
echo =========================================
echo.
echo Two new windows have opened:
echo   1. Backend Server (Python/FastAPI)
echo   2. Frontend Server (React/Vite)
echo.
echo Open your browser to: http://localhost:3000
echo.
echo To stop the servers, close both terminal windows
echo or press Ctrl+C in each window.
echo.
echo View the API documentation: http://localhost:8000/api/docs
echo.
pause
