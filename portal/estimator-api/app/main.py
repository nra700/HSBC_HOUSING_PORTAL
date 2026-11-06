"""App 1 backend: Property Value Estimator (Python / FastAPI).

Sits between the Next.js portal and the Task 1 model container.
  POST   /api/estimates          validate -> call model -> store in history
  GET    /api/estimates          history (newest first)
  DELETE /api/estimates          clear history
  DELETE /api/estimates/{id}     remove one
  POST   /api/compare            2-6 properties side by side
  GET    /api/health
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

MODEL_API_URL = os.getenv("MODEL_API_URL", "http://localhost:8000")
DB_PATH = os.getenv("HISTORY_DB", "history.sqlite3")


class Property(BaseModel):
    square_footage: float = Field(ge=200, le=20000)
    bedrooms: float = Field(ge=0, le=15)
    bathrooms: float = Field(ge=0.5, le=12)
    year_built: float = Field(ge=1800, le=2026)
    lot_size: float = Field(ge=0, le=200000)
    distance_to_city_centre: float = Field(ge=0, le=200)
    school_rating: float = Field(ge=0, le=10)
    label: str | None = Field(default=None, max_length=60)


class EstimateRecord(BaseModel):
    id: int
    created_at: str
    label: str | None
    inputs: dict[str, float]
    predicted_price_usd: float


class CompareRequest(BaseModel):
    properties: list[Property] = Field(min_length=2, max_length=6)


class History:
    """Tiny SQLite store. One connection guarded by a lock is plenty for a demo."""

    def __init__(self, path: str):
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        self._db.execute(
            "CREATE TABLE IF NOT EXISTS estimates (id INTEGER PRIMARY KEY AUTOINCREMENT,"
            " created_at TEXT, label TEXT, inputs TEXT, price REAL)")
        self._db.commit()

    def add(self, label, inputs, price) -> EstimateRecord:
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with self._lock:
            cur = self._db.execute(
                "INSERT INTO estimates (created_at,label,inputs,price) VALUES (?,?,?,?)",
                (now, label, json.dumps(inputs), price))
            self._db.commit()
            return EstimateRecord(id=cur.lastrowid, created_at=now, label=label,
                                  inputs=inputs, predicted_price_usd=price)

    def list(self, limit: int = 100) -> list[EstimateRecord]:
        with self._lock:
            rows = self._db.execute(
                "SELECT id,created_at,label,inputs,price FROM estimates ORDER BY id DESC LIMIT ?",
                (limit,)).fetchall()
        return [EstimateRecord(id=r[0], created_at=r[1], label=r[2], inputs=json.loads(r[3]),
                               predicted_price_usd=r[4]) for r in rows]

    def delete(self, id_: int | None = None) -> int:
        with self._lock:
            cur = (self._db.execute("DELETE FROM estimates WHERE id=?", (id_,)) if id_ is not None
                   else self._db.execute("DELETE FROM estimates"))
            self._db.commit()
            return cur.rowcount


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.history = History(DB_PATH)
    app.state.http = httpx.AsyncClient(base_url=MODEL_API_URL, timeout=10.0)
    yield
    await app.state.http.aclose()


app = FastAPI(title="Property Value Estimator API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    """Flatten pydantic errors to {field: message} so the form can show them inline."""
    fields = {".".join(str(p) for p in e["loc"] if p != "body"): e["msg"] for e in exc.errors()}
    return JSONResponse(status_code=422, content={"detail": "Validation failed", "fields": fields})


def history(request: Request) -> History:
    return request.app.state.history


async def predict(request: Request, props: list[Property]) -> list[dict]:
    payload = {"instances": [p.model_dump(exclude={"label"}) for p in props]}
    try:
        r = await request.app.state.http.post("/predict", json=payload)
        r.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Model service rejected the request ({e.response.status_code})")
    except httpx.HTTPError:
        raise HTTPException(503, "Model service is unavailable")
    return r.json()["predictions"]


@app.post("/api/estimates", response_model=EstimateRecord, status_code=201)
async def create_estimate(prop: Property, request: Request, store: Annotated[History, Depends(history)]):
    (pred,) = await predict(request, [prop])
    return store.add(prop.label, prop.model_dump(exclude={"label"}),
                     pred["predicted_price_usd"])


@app.get("/api/estimates", response_model=list[EstimateRecord])
def list_estimates(store: Annotated[History, Depends(history)]):
    return store.list()


@app.delete("/api/estimates", status_code=204)
def clear_estimates(store: Annotated[History, Depends(history)]):
    store.delete()


@app.delete("/api/estimates/{estimate_id}", status_code=204)
def delete_estimate(estimate_id: int, store: Annotated[History, Depends(history)]):
    if store.delete(estimate_id) == 0:
        raise HTTPException(404, "Estimate not found")


@app.post("/api/compare")
async def compare(body: CompareRequest, request: Request):
    preds = await predict(request, body.properties)
    prices = [p["predicted_price_usd"] for p in preds]
    base = prices[0]
    items = [{
        "label": p.label or f"Property {i + 1}",
        "inputs": p.model_dump(exclude={"label"}),
        "predicted_price_usd": price,
        "diff_vs_first_usd": round(price - base, 2),
        "diff_vs_first_pct": round((price - base) / base * 100, 2) if base else None,
    } for i, (p, price) in enumerate(zip(body.properties, prices))]
    return {"items": items, "highest": max(range(len(prices)), key=prices.__getitem__),
            "lowest": min(range(len(prices)), key=prices.__getitem__)}


@app.get("/api/model-info")
async def model_info(request: Request):
    """Pass-through so the UI can show a per-feature price breakdown."""
    try:
        r = await request.app.state.http.get("/model-info")
        r.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(503, "Model service is unavailable")
    return r.json()


@app.get("/api/health")
async def health(request: Request):
    try:
        r = await request.app.state.http.get("/health")
        model_ok = r.status_code == 200 and r.json().get("model_loaded", False)
    except httpx.HTTPError:
        model_ok = False
    return {"status": "ok" if model_ok else "degraded", "model_service": model_ok}
