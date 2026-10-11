# NASA Spacecraft Telemetry Anomaly Detection System (Production Full-Stack)

An end-to-end, AI-powered system for detecting real-time anomalies in NASA spacecraft telemetry signals (SMAP/MSL dataset). The system features an **XGBoost Machine Learning Pipeline**, a **FastAPI Python Backend**, and a modern, interactive **React.js Mission Control Dashboard** built with Tailwind CSS and Recharts.

---

## 🛰️ Architecture & Highlights

- **ML Pipeline**: Powered by `nasa_smap_xgboost_pipeline.pkl`, containing:
  - `StatisticalFeatureExtractor`: 250 statistical sliding-window features (window: 100, stride: 5) + 54 One-Hot-Encoded spacecraft channel features = **304 features**.
  - `StandardScaler`: Normalizes 304 feature dimensions.
  - `XGBClassifier`: Classifies anomalies and computes probability scores.
- **FastAPI REST Backend**:
  - `GET /api/health`: Health status & pipeline loaded confirmation.
  - `POST /api/predict`: Telemetry file upload (`.npy`) returning anomaly sequences, ratios, and health status.
  - `GET /api/samples`: List available SMAP/MSL benchmark channels.
  - `POST /api/sample/{channel}`: 1-click test channel evaluation.
- **Production Entrypoints**:
  - `backend/run.py`: Local development server.
  - `backend/asgi.py`: Production ASGI server callable (Uvicorn / Hypercorn / Gunicorn with uvicorn workers).
  - `backend/wsgi.py`: WSGI adapter callable.
- **NASA Space Control Frontend**:
  - Dark-themed mission control interface.
  - Drag-and-drop `.npy` telemetry channel upload.
  - Recharts time-series chart highlighting anomalous regions in **RED** with zoom/pan brush slider.
  - Diagnostic KPI status cards (`NORMAL`, `WARNING`, `CRITICAL ANOMALY`).
  - Sequence anomaly details table with exportable JSON report.

---

## 📁 Repository Directory Structure

```text
NASA_Spacecraft_Anomaly_Detection/
├── .gitignore                                  # GitHub ignore rules (Python, Node, IDE)
├── README.md                                   # Project documentation
├── notebooks/
│   └── anomaly-detection-for-spacecraft.ipynb  # Updated research & EDA notebook
├── models/
│   └── nasa_smap_xgboost_pipeline.pkl          # Trained XGBoost Pipeline (304 features)
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                             # FastAPI endpoints
│   │   ├── feature_extraction.py               # StatisticalFeatureExtractor & sliding windows
│   │   └── predictor.py                        # Pipeline inference & sequence aggregator
│   ├── requirements.txt                        # Python dependencies
│   ├── run.py                                  # Local development server launcher
│   ├── asgi.py                                 # ASGI production entrypoint
│   └── wsgi.py                                 # WSGI compatibility entrypoint
└── frontend/
    ├── public/
    │   └── index.html                          # Public HTML template
    ├── src/
    │   ├── components/
    │   │   ├── UploadChannel.js                # Dropzone & channel picker
    │   │   ├── TelemetryChart.js               # Time-series chart with RED anomaly highlights
    │   │   └── MetricsSummary.js               # KPI diagnostic status cards
    │   ├── App.js                              # Main dashboard view
    │   ├── index.js
    │   └── index.css                           # Tailwind directives & glassmorphic styling
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 💻 Installation & Quick Start

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd "D:\NASA_Spacecraft_Anomaly_Detection\backend"
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the server:
   - **For Development**:
     ```bash
     python run.py
     ```
   - **For Production (ASGI)**:
     ```bash
     uvicorn asgi:application --host 0.0.0.0 --port 8000 --workers 4
     ```
   The backend will be live on **`http://localhost:8000`**. You can inspect the interactive OpenAPI docs at `http://localhost:8000/docs`.

---

### 2. Frontend Setup (React.js)

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd "D:\NASA_Spacecraft_Anomaly_Detection\frontend"
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Launch the dashboard:
   ```bash
   npm start
   ```
   The dashboard will automatically open at **`http://localhost:3000`**.

---

## 🚀 GitHub Push Instructions

Initialize and push this clean directory directly to your GitHub repository:

```bash
cd "D:\NASA_Spacecraft_Anomaly_Detection"
git init
git add .
git commit -m "feat: initial commit of NASA Spacecraft Telemetry Anomaly Detection full-stack app"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
git push -u origin main
```
