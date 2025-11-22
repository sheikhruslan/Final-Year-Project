# Setup and Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download Node.js](https://nodejs.org/)
- **Git** (optional) - [Download Git](https://git-scm.com/)

Check versions:
```powershell
python --version
node --version
npm --version
```

---

## Step-by-Step Setup

### Step 1: Backend Setup

1. **Open PowerShell** and navigate to the project directory:
```powershell
cd C:\Users\WINDOWS\Desktop\final_year_project\backend
```

2. **Create Python virtual environment**:
```powershell
python -m venv venv
```

3. **Activate the virtual environment**:
```powershell
.\venv\Scripts\Activate.ps1
```

If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

4. **Install Python dependencies**:
```powershell
pip install -r requirements.txt
```

This will install:
- FastAPI (web framework)
- XGBoost (machine learning)
- Pandas, NumPy (data processing)
- Scikit-learn (ML utilities)
- And more...

5. **Create environment configuration**:
```powershell
Copy-Item .env.example .env
```

6. **Generate synthetic test data**:
```powershell
python utils/data_generator.py
```

This creates 500 sample insurance claims (15% fraudulent) for testing.

7. **Start the backend server**:
```powershell
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is now running! Test it by visiting: http://localhost:8000/api/docs

---

### Step 2: Frontend Setup

**Open a NEW PowerShell window** (keep the backend running):

1. **Navigate to frontend directory**:
```powershell
cd C:\Users\WINDOWS\Desktop\final_year_project\frontend
```

2. **Install Node dependencies**:
```powershell
npm install
```

This will install:
- React 18 (UI framework)
- Material-UI (components)
- Recharts (visualizations)
- React Query (data fetching)
- And more...

Installation may take 2-5 minutes.

3. **Start the development server**:
```powershell
npm run dev
```

You should see:
```
  VITE v5.0.5  ready in 500 ms

  ➜  Local:   http://localhost:3000/
```

✅ Frontend is now running! Open your browser to: http://localhost:3000

---

## Accessing the Application

Once both servers are running:

1. **Main Dashboard**: http://localhost:3000/dashboard
   - View overall statistics
   - See fraud trends
   - Monitor risk distribution

2. **Claims List**: http://localhost:3000/claims
   - Browse all claims
   - Filter by status and risk level
   - View individual claim details

3. **Upload Claim**: http://localhost:3000/upload
   - Upload claim documents
   - Automatic OCR extraction
   - Instant fraud analysis

4. **AI Assistant**: http://localhost:3000/chat
   - Ask questions about fraud patterns
   - Generate custom visualizations
   - Get explanations of detection methods

5. **API Documentation**: http://localhost:8000/api/docs
   - Interactive API testing
   - View all endpoints
   - Test requests directly

---

## Testing the System

### Quick Test Flow:

1. **Navigate to Upload page** (http://localhost:3000/upload)
2. **Upload a test document** (any PDF/image)
3. **View extracted data** - The OCR service will extract claim information
4. **Click "Analyze Claim"** - Navigate to detailed analysis
5. **Review the results**:
   - Risk score (0-100)
   - Component breakdown (ML, Benford, Rules)
   - Flagged rules
   - Top risk factors
   - Recommendations

### Using the AI Assistant:

1. **Navigate to AI Assistant** (http://localhost:3000/chat)
2. **Try these sample queries**:
   - "Show me fraud trends for the last 30 days"
   - "What are the top risk factors?"
   - "Explain how Benford's Law works"
   - "Generate a chart of risk score distribution"

---

## Common Issues and Solutions

### Issue: "Python not recognized"
**Solution**: Add Python to your PATH environment variable or use full path to python.exe

### Issue: "Cannot activate virtual environment"
**Solution**: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Port 8000 already in use"
**Solution**: Either:
- Kill the process using port 8000
- Or change the port in `backend/.env`: `API_PORT=8001`

### Issue: "Port 3000 already in use"
**Solution**: Change port in `frontend/vite.config.ts`

### Issue: "Module not found" errors
**Solution**: 
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

### Issue: NPM installation fails
**Solution**: Try:
```powershell
npm cache clean --force
npm install
```

---

## Development Workflow

### Daily Development:

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Making Changes:

- **Backend changes**: The server auto-reloads on file changes
- **Frontend changes**: Vite hot-reloads instantly

### Stopping the Servers:

Press `Ctrl+C` in each terminal window

---

## Next Steps

### When You Have Real Data:

1. **Update data sources** in `backend/services/`:
   - Replace mock data in `claim_processor.py`
   - Connect to HKFI API in `fraud_detector.py`
   - Update feature engineering with real statistics

2. **Train ML model**:
   - Prepare labeled dataset
   - Run training script (to be created)
   - Save trained model to `models/` directory
   - Update `fraud_detector.py` to load new model

3. **Configure OCR**:
   - Get Tesseract or Azure Form Recognizer credentials
   - Update `backend/.env` with API keys
   - Implement actual OCR in `services/ocr_service.py`

4. **Set up database**:
   - Install PostgreSQL
   - Update DATABASE_URL in `.env`
   - Create database migrations

### Adding AI Features:

1. **Get API keys**:
   - OpenAI API key for GPT-4
   - Or Anthropic API key for Claude

2. **Update `.env`**:
```
OPENAI_API_KEY=your-key-here
```

3. **Test AI chatbot** with real LLM integration

---

## Project Structure Reference

```
final_year_project/
├── backend/
│   ├── api/routes/          # API endpoints
│   ├── services/            # Business logic
│   ├── utils/               # Helper functions
│   ├── data/                # Data storage
│   ├── models/              # ML models
│   └── main.py              # Application entry
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Main application pages
│   │   ├── services/        # API client
│   │   └── main.tsx         # Application entry
│   └── package.json
│
└── README.md
```

---

## Support

If you encounter issues:

1. Check this guide's "Common Issues" section
2. Review `DEVELOPMENT.md` for development scripts
3. Check the console/terminal for error messages
4. Verify all prerequisites are installed correctly

---

## Success Checklist

- ✅ Python 3.9+ installed
- ✅ Node.js 16+ installed
- ✅ Backend virtual environment created
- ✅ Backend dependencies installed
- ✅ Backend server running on port 8000
- ✅ Frontend dependencies installed
- ✅ Frontend server running on port 3000
- ✅ Can access http://localhost:3000
- ✅ Can access http://localhost:8000/api/docs
- ✅ Test claim uploaded successfully
- ✅ Dashboard displays statistics

**You're ready to use the Hong Kong Insurance Fraud Detection System!** 🎉
