# Food Rescue AI

AI-assisted surplus food donation and redistribution platform aligned with:
- **SDG 2 — Zero Hunger**
- **SDG 12 — Responsible Consumption and Production**

This starter project contains a React frontend, Python Flask API, Firebase/Firestore integration scaffolding, and a simple explainable matching/risk-demo module.

> **Important:** This is a starter project, not a production-ready deployment. Firebase credentials, security rules, and real operational validation must be configured before using real people or food donations. ML risk predictions are demo estimates and must never be used to certify food safety.

## Features in this starter
- React dashboard with demo donation listings
- Add a food donation
- Search and filter available donations
- NGO recommendation score using transparent rules
- Donation status tracking
- Python Flask API with optional Firestore persistence
- Simple risk estimate for demo purposes
- SDG impact counters based on demo/application records

## Tech stack
- Frontend: React + Vite
- Backend: Python + Flask
- Database: Firebase Cloud Firestore (optional; demo mode works without credentials)
- ML: Scikit-learn-ready project structure (demo risk estimator included)

## Requirements
- Node.js 18+
- Python 3.10+
- VS Code (recommended)

## Run locally

### 1. Backend
Open a terminal in `backend/`:

```bash
python -m venv .venv
```

Windows:
```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install packages:
```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and configure Firebase only if you want Firestore persistence. The app runs in local demo mode without Firebase credentials.

Start API:
```bash
python app.py
```

API runs at `http://127.0.0.1:5000`.

### 2. Frontend
Open a second terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Firebase setup (optional)
1. Create a Firebase project at the Firebase Console.
2. Enable Cloud Firestore.
3. Create a service account for the backend.
4. Download its JSON key and save it securely outside public frontend files.
5. Set `FIREBASE_SERVICE_ACCOUNT_PATH` in `backend/.env` to that file path.
6. Never commit the service-account key or expose it in the frontend.

This starter uses server-side Firebase Admin SDK if credentials are configured. For a public deployment, add production-grade authentication, authorization, Firestore security rules, validation, logging, rate limits, and secure claim transactions.

## Main folders
```text
Food_Rescue_AI/
├── frontend/       # React + Vite UI
├── backend/        # Flask API and optional Firestore adapter
├── ml/             # demo risk scoring and training-data example
├── docs/           # project notes
└── README.md
```

## Donation statuses
`Available → Claimed → Pickup Scheduled → Collected → Delivered`

Other statuses: `Cancelled`, `Expired`.

## Safety notes
- Only list food that can legally and safely be donated.
- Include preparation time, pickup deadline, allergen and storage notes.
- Follow applicable local food-safety and handling requirements.
- The application does not certify food as safe.
- Demo records and impact estimates are not real-world outcomes.
