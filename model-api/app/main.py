"""Task 1: Housing Price Prediction Model API.

Endpoints
  POST /predict     single property (object) or batch ({"instances": [...]})
  GET  /model-info  coefficients and performance metrics
  GET  /health      liveness / model-loaded check
Swagger UI at /docs, OpenAPI JSON at /openapi.json.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .features import FEATURES
from .model_service import ModelService
from .schemas import BatchRequest, HealthResponse, HouseFeatures, PredictResponse

log = logging.getLogger("model-api")
MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).resolve().parents[1] / "artifacts" / "model.joblib"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.model = ModelService(MODEL_PATH)
        log.info("Model loaded from %s", MODEL_PATH)
    except FileNotFoundError:
        app.state.model = None
        log.error("Model file %s not found; run train.py", MODEL_PATH)
    yield


app = FastAPI(
    title="Housing Price Prediction API",
    description="Ridge regression on California-housing-style features. Prices are in USD.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])


def _model() -> ModelService:
    model = app.state.model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return model


@app.post("/predict", response_model=PredictResponse, tags=["prediction"],
          summary="Predict price for one property or a batch")
def predict(body: HouseFeatures | BatchRequest) -> PredictResponse:
    items = body.instances if isinstance(body, BatchRequest) else [body]
    preds = _model().predict(items)
    return PredictResponse(count=len(preds), predictions=preds)


@app.get("/model-info", tags=["model"], summary="Coefficients and performance metrics")
def model_info() -> dict:
    meta = _model().meta
    return {**meta, "feature_descriptions": {f.name: f.description for f in FEATURES}}


@app.get("/health", response_model=HealthResponse, tags=["ops"])
def health() -> HealthResponse:
    loaded = app.state.model is not None
    return HealthResponse(status="ok" if loaded else "degraded", model_loaded=loaded)
