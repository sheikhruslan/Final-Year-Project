# Predictive Analytics for Fraudulent Health Insurance Claims in Hong Kong

**Author:** Ruslan Sheikh (22204016)

## Project Overview

An integrated AI system for automated detection of fraudulent insurance claims in Hong Kong's healthcare and life insurance market. The system combines machine learning, statistical analysis (Benford's Law), and rule-based detection with an interactive dashboard for insurance investigators.

## Architecture

### Backend
- **Python 3.9+** with FastAPI
- **Machine Learning:** XGBoost for fraud classification
- **Statistical Analysis:** Benford's Law deviation detection
- **OCR:** Tesseract/Azure Form Recognizer for document extraction
- **Database:** PostgreSQL (or MongoDB for document storage)

### Frontend
- **React 18** with TypeScript
- **UI Framework:** Material-UI (MUI)
- **Visualization:** D3.js, Recharts, Plotly
- **State Management:** React Query + Context API

### AI Components
- Multi-stage RAG pipeline via Dify platform integration
- Feature engineering for behavioral pattern detection
- Ensemble ML methods for imbalanced datasets
- AI chatbot with code generation for custom analysis

## Features

✅ **Document Upload & OCR Processing** - Extract claim data automatically  
✅ **Multi-Layered Fraud Detection** - ML + Statistical + Rule-based checks  
✅ **Interactive Dashboard** - Risk scores with confidence intervals  
✅ **Network Analysis** - Visualize fraud ring connections  
✅ **Geographic Mapping** - Identify spatial fraud patterns  
✅ **Temporal Analysis** - Detect timing anomalies  
✅ **AI Chatbot** - Natural language queries + code generation  
✅ **Explainable AI** - Feature importance and decision transparency  

## Project Structure

```
final_year_project/
├── backend/               # Python API server
│   ├── api/              # API endpoints
│   ├── models/           # ML models and utilities
│   ├── services/         # Business logic
│   ├── database/         # Database models
│   └── utils/            # Helper functions
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Dashboard pages
│   │   ├── services/     # API clients
│   │   └── utils/        # Helpers
│   └── public/
├── data/                 # Data storage (synthetic for now)
├── models/               # Trained ML models
└── docs/                 # Documentation

```

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Data Sources (Planned)

- **Primary:** HKFI Insurance Fraud Prevention Claims Database (requires partnership)
- **Supplementary:** IEEE-CIS Fraud Detection Dataset, Amazon Fraud Benchmark
- **Synthetic:** CTGAN-generated realistic claims for testing

## Target Use Cases

- **Indemnity Health Insurance Claims** - Hospital stays, surgeries, consultations
- **Personal Accident Claims** - Injury/disability reimbursements
- **Fraud Types:** Billing for non-rendered services, upcoding, staged accidents, ghost brokers

## Unique Value Proposition

1. **Multi-Faceted Detection** - Combines ML, statistical, and rule-based approaches
2. **Hong Kong Context** - Designed for 26+ insurers, 5000+ healthcare providers
3. **Explainable AI** - Transparent reasoning for investigator trust
4. **Flexible Architecture** - Quick adaptation to emerging fraud patterns
5. **Operational Efficiency** - Automates initial screening, focuses human expertise

## Development Status

🟡 **In Progress** - Core infrastructure being built  
🔴 **Pending** - Real dataset acquisition and training  
🟢 **Complete** - N/A (initial phase)

## License

MIT License - Educational Project
