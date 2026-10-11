import io
import os
import glob
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.predictor import get_predictor

app = FastAPI(
    title="NASA Spacecraft Telemetry Anomaly Detection API",
    description="Production-grade AI anomaly detection for NASA SMAP/MSL spacecraft telemetry using XGBoost Pipeline.",
    version="2.0.0"
)

# Enable CORS for React Frontend Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "NASA Spacecraft Telemetry Anomaly Detection API",
        "status": "online",
        "version": "2.0.0",
        "endpoints": {
            "health": "/api/health",
            "predict": "/api/predict (POST .npy file)",
            "samples": "/api/samples (GET benchmark channels)",
            "sample_predict": "/api/sample/{channel_name} (POST)"
        }
    }

@app.get("/api/health")
def health_check():
    try:
        predictor = get_predictor()
        pipeline = predictor.pipeline
        return {
            "status": "HEALTHY",
            "backend": "FastAPI",
            "pipeline_loaded": pipeline is not None,
            "pipeline_steps": list(pipeline.named_steps.keys()),
            "total_features": getattr(pipeline.named_steps.get("scaler"), "n_features_in_", 304)
        }
    except Exception as e:
        return {
            "status": "UNHEALTHY",
            "error": str(e)
        }

@app.post("/api/predict")
async def predict_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".npy"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .npy telemetry files are supported.")

    try:
        contents = await file.read()
        buffer = io.BytesIO(contents)
        raw_data = np.load(buffer, allow_pickle=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read numpy array from uploaded file: {str(e)}")

    channel_name = file.filename.replace(".npy", "")

    try:
        predictor = get_predictor()
        result = predictor.predict(raw_data, channel_name=channel_name)
        result["filename"] = file.filename
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly inference failed: {str(e)}")

@app.get("/api/samples")
def list_sample_channels():
    """Returns available test channels from SMAP dataset directory."""
    candidate_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "archive", "data", "data", "test"),
        r"D:\01- Development and Projects\Project_ML\Project_ML\archive\data\data\test"
    ]
    for path in candidate_paths:
        if os.path.exists(path):
            npy_files = sorted(glob.glob(os.path.join(path, "*.npy")))
            return {"samples": [os.path.basename(f) for f in npy_files]}

    # Fallback default known SMAP benchmark channels
    return {"samples": ["T-1.npy", "P-1.npy", "A-1.npy", "S-1.npy", "E-1.npy", "E-2.npy", "E-3.npy", "D-1.npy"]}

@app.post("/api/sample/{channel_name}")
def predict_sample_channel(channel_name: str):
    """Executes prediction on an included SMAP benchmark channel."""
    if not channel_name.endswith(".npy"):
        channel_name += ".npy"

    candidate_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "archive", "data", "data", "test", channel_name),
        os.path.join(r"D:\01- Development and Projects\Project_ML\Project_ML\archive\data\data\test", channel_name)
    ]
    sample_path = None
    for cp in candidate_paths:
        if os.path.exists(cp):
            sample_path = cp
            break

    if sample_path is None or not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"Sample channel file '{channel_name}' not found.")

    try:
        raw_data = np.load(sample_path, allow_pickle=True)
        predictor = get_predictor()
        result = predictor.predict(raw_data, channel_name=channel_name)
        result["filename"] = channel_name
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed on channel {channel_name}: {str(e)}")
