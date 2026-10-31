# Farm Management System (FMS)

A modern digital agriculture platform designed to help farmers manage crop cultivation lifecycles, record farming expenses, track harvest and sales, compute financial returns (cost per acre, revenue, profit/loss), and leverage AI/ML algorithms for intelligent agriculture decisions.

---


## Technology Stack

- **Frontend:** React.js (Vite), JavaScript (ES6+), Bootstrap 5, Bootstrap Icons, HTML5, CSS3, React Router v7.
- **Backend:** Python 3.11, Django 4.2 / 5.0, Django REST Framework (DRF), django-cors-headers, PyMySQL.
- **Database:** MySQL (Configurable in `backend/.env` with local dev fallback).
- **AI/ML Stack (Scheduled for Phase 8):** Python, Scikit-Learn, Pandas, NumPy.
- **Visualization (Scheduled for Phase 7):** Chart.js / Recharts.
- **Development & Version Control:** Visual Studio Code, Git, GitHub.

---

## Project Folder Structure

```
Farm-Management-System/
│
├── .gitignore                      # Root Git ignore rules (node_modules, venv, db)
├── README.md                       # Complete documentation & execution guide
│
├── backend/                        # Django REST Framework backend
│   ├── .env.example                # Example configuration file for MySQL settings
│   ├── manage.py                   # Django management script
│   ├── requirements.txt            # Python package dependencies
│   ├── venv/                       # Dedicated Python 3.11 virtual environment
│   ├── fms_backend/                # Core Django project configuration
│   │   ├── __init__.py             # PyMySQL initialization
│   │   ├── settings.py             # DRF, CORS, database, and installed apps
│   │   ├── urls.py                 # Root URL configuration (/api/ routing)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── api/                        # API application
│       ├── views.py                # Status and future API controllers
│       ├── urls.py                 # Module endpoint mapping
│       ├── tests.py                # Automated tests
│       └── models.py               # Database schemas (ready for Phase 2+)
│
└── frontend/                       # React.js application (Vite + Bootstrap 5)
    ├── package.json                # NPM dependencies and scripts
    ├── vite.config.js              # Vite configuration
    ├── index.html                  # HTML entry point with typography
    ├── src/
    │   ├── main.jsx                # React root bootstrap with Router & Bootstrap
    │   ├── App.jsx                 # Route definitions and layout mapping
    │   ├── App.css
    │   ├── index.css               # Agricultural color palette and responsive styling
    │   ├── components/
    │   │   ├── Navbar.jsx          # Top navigation bar with farmer profile
    │   │   ├── Sidebar.jsx         # Sidebar navigation with active indicator
    │   │   └── DashboardLayout.jsx # Unified shell layout for dashboard pages
    │   └── pages/
    │       ├── LandingPage.jsx     # Public landing / home page
    │       ├── LoginPage.jsx       # Farmer login interface
    │       ├── RegisterPage.jsx    # Farmer registration interface
    │       ├── DashboardPage.jsx   # Farmer dashboard with 4 metric cards
    │       └── placeholders/       # Modular placeholders for upcoming phases
    │           ├── CropsPage.jsx           # Phase 3 
    │           ├── ExpensesPage.jsx        # Phase 4 
    │           ├── HarvestSalesPage.jsx    # Phase 5 
    │           ├── ReportsPage.jsx         # Phase 6 & 7 
    │           ├── AICropRecPage.jsx       # Phase 8 
    │           ├── AIYieldPredPage.jsx     # Phase 8 
    │           └── AIProfitPredPage.jsx    # Phase 8 
```

---

## Getting Started: How to Run the Application

### 1. Prerequisites
- **Node.js**: v18+ (tested with v24.x) & npm
- **Python**: 3.11.x
- **MySQL**: MySQL Server 8.0 running locally on port 3306

---

### 2. Backend Setup & Execution

Open a terminal (Command Prompt or PowerShell) and navigate to the project root:

```cmd
# 1. Navigate to backend directory
cd d:\SEM_3\FMS\backend

# 2. Run Django server directly using the virtual environment python:
.\venv\Scripts\python.exe manage.py runserver 8000
```

> **Alternatively, to activate the virtual environment first:**
> - If using **Command Prompt (CMD)**:
>   ```cmd
>   venv\Scripts\activate.bat
>   python manage.py runserver 8000
>   ```
> - If using **PowerShell**:
>   ```powershell
>   .\venv\Scripts\Activate.ps1
>   python manage.py runserver 8000
>   ```


The Django REST API will be accessible at:
- **API Status Endpoint:** [http://127.0.0.1:8000/api/status/](http://127.0.0.1:8000/api/status/)
- **Django Admin:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

To run the automated tests:
```powershell
python manage.py test api
```

---

### 3. Frontend Setup & Execution

Open a second terminal at the project root:

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Start the Vite development server
npm run dev
```

The React frontend will be accessible in your web browser at:
- **Application URL:** [http://localhost:5173/](http://localhost:5173/)

---

## Current Status & Roadmap

### What is Currently Implemented (Phases 1 through 8 Completed)

1. **Phase 1: Architecture & Project Setup**
   - Git repository structure for collaborative development.
   - Django REST Framework backend with CORS and MySQL configuration with SQLite fallback.
   - React.js frontend powered by Vite and Bootstrap 5 with responsive agricultural theming.

2. **Phase 2: Authentication & Profile System **
   - Custom `FarmerProfile` model linked to Django's built-in `User`.
   - Token-based authentication (`rest_framework.authtoken`) for secure API communication.
   - Farmer registration (`/api/auth/register/`), login (`/api/auth/login/`), and profile endpoints.
   - Protected route wrappers in React and persistent token handling.

3. **Phase 3: Fields & Crops Management **
   - Land parcel models (`Field`) with soil type classification.
   - Crop lifecycle models (`Crop`) supporting season tracking, sowing date, and crop status (`Sown`, `Growing`, `Harvested`, `Closed`).
   - Comprehensive CRUD interfaces with modal forms in React.

4. **Phase 4: Expense Tracking **
   - Itemized expenditure model (`Expense`) across 8 agricultural categories (Seeds, Labor, Fertilizers, Pesticides, Irrigation, Machinery, Transportation, Misc).
   - Real-time expense computation and crop-linked categorization.

5. **Phase 5: Harvest & Sales Management **
   - Yield produce logging (`Harvest`) supporting multiple units (Quintals, Tonnes, Bags, Kgs).
   - Market trade logging (`Sale`) with automated total amount calculation (`quantity_sold * selling_price`).

6. **Phase 6: Financial Calculation Engine **
   - Dynamic financial metrics per crop cycle: Total Cost, Total Revenue, Net Profit/Loss, Cost per Acre, and Profit per Acre.
   - On-demand calculation endpoint (`/api/financial/crop/<id>/recalculate/`).

7. **Phase 7: Interactive Visualizations & Reports **
   - **Chart.js** & **react-chartjs-2** integration:
     - Interactive multi-dataset Bar charts comparing Revenue vs. Cost vs. Net Profit across all crops.
     - Doughnut charts displaying financial distribution in Dashboard and Reports.
   - **Export capabilities**: 1-click dynamic CSV export and Print/PDF generation.
   - **Bilingual Marathi/English switch**: Full system localization with real-time language toggling.

8. **Phase 8: Machine Learning Advisory Pipelines **
   - **AI Crop Recommendation** : Trained Scikit-Learn `RandomForestClassifier` pipeline (`crop_recommendation_model.pkl`) evaluating soil type, seasonal patterns, and irrigation mode.
   - **AI Yield Prediction** : Trained Scikit-Learn `GradientBoostingRegressor` pipeline (`yield_prediction_model.pkl`) predicting yield output based on crop variety, soil quality, fertilizer dosage, acreage, and rainfall.
   - **AI Profit Prediction** : Trained Scikit-Learn `RandomForestRegressor` pipeline (`profit_prediction_model.pkl`) projecting agricultural margins from market APMC trends and input costs.
   - Dedicated offline training pipeline in `backend/ml_models/train_models.py`.

9. **Phase 9: Comprehensive System Admin Operations Suite **
   - **Administrative Authentication & Governance**: Dedicated admin auth flow (`/admin/login`) with staff/superuser token verification. Default credentials: `systemadmin` / `adminsystem123`.
   - **Farmer Governance & Full Dossier**: Direct farmer onboarding, active/inactive status toggle, profile editing, password resets, and comprehensive individual dossiers with fields, cultivated crops, expense breakdowns, and AI history.
   - **Crop Operations Management**: Centralized operations dashboard (`/admin/crops`) across all farmers, filtering by lifecycle status (`Sown`, `Growing`, `Harvested`, `Closed`) and season (`Kharif`, `Rabi`, `Zaid`, `Annual`), with status transitions and CSV export.
   - **Agricultural Land Parcels (`/admin/fields`)**: Platform-wide acreage, average plot sizes, and soil classification distribution (Black, Red, Loamy, Alluvial, Clayey, Sandy).
   - **Financials & Transactions Center (`/admin/financials`)**: Dual-tab operations center for auditing itemized cultivation expenses and market produce sales trades.
   - **APMC Mandi Board Management (`/admin/mandi`)**: Live commodity benchmark rates board across Maharashtra APMC mandis, with real-time editing and addition of commodity rates.
   - **AI & ML Diagnostics (`/admin/ai-advisory`)**: Model serialization file checks (`.pkl` file sizes, algorithms, statuses), 1-click model retraining trigger, and logs of all farmer AI consultations.
   - **Broadcast Advisories & Announcements (`/admin/announcements`)**: System announcements for weather warnings, pest outbreak alerts, and government subsidies, surfaced directly on the farmer dashboard.
   - **System Health & Maintenance Diagnostics (`/admin/system`)**: Database ping latency, table record statistics, server environment telemetry, and 1-click dynamic recalculation of all crop financials.

---

## Machine Learning Pipeline & Training

To retrain or update the Scikit-Learn pipelines:

```powershell
cd d:\SEM_3\FMS\backend
.\venv\Scripts\python.exe ml_models\train_models.py
```

Generated `.pkl` pipelines are stored in `backend/ml_models/saved_models/` and automatically loaded by Django views on startup.

