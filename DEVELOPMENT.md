# Development Scripts

## Backend Setup and Run

### Initial Setup (Windows PowerShell)
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file
Copy-Item .env.example .env

# Generate synthetic data
python utils/data_generator.py

# Run the server
python main.py
```

### Quick Start (After Initial Setup)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

Server will run at: http://localhost:8000
API Documentation: http://localhost:8000/api/docs

---

## Frontend Setup and Run

### Initial Setup (Windows PowerShell)
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Quick Start (After Initial Setup)
```powershell
cd frontend
npm run dev
```

Application will run at: http://localhost:3000

---

## Full Stack Development

### Terminal 1 (Backend):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

### Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

---

## Building for Production

### Backend:
```powershell
cd backend
pip install -r requirements.txt
# Deploy using uvicorn or gunicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend:
```powershell
cd frontend
npm run build
# Serve the dist folder with any static server
```

---

## Troubleshooting

### Python Version
Ensure you have Python 3.9+ installed:
```powershell
python --version
```

### Node Version
Ensure you have Node 16+ installed:
```powershell
node --version
```

### Port Already in Use
If port 8000 or 3000 is already in use, you can change it:
- Backend: Edit `.env` file and change `API_PORT`
- Frontend: Edit `vite.config.ts` and change server port

### Virtual Environment Issues
If virtual environment activation fails, try:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Missing Dependencies
Make sure to run installations in correct directories:
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```
