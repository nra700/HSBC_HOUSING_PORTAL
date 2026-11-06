"""Train the housing price regression model and save it to artifacts/model.joblib.

Run: python train.py [--data ../data/housing.csv]
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.features import FEATURE_NAMES, TARGET

HERE = Path(__file__).resolve().parent
DEFAULT_DATA = HERE.parent / "data" / "housing.csv"
ARTIFACT = HERE / "artifacts" / "model.joblib"


def train(data_path: Path, out: Path = ARTIFACT) -> dict:
    df = pd.read_csv(data_path)
    X, y = df[FEATURE_NAMES], df[TARGET]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

    pipe = Pipeline([("scale", StandardScaler()), ("reg", Ridge(alpha=1.0))])
    pipe.fit(X_tr, y_tr)
    pred = pipe.predict(X_te)

    # Coefficients on the original (unscaled) feature scale are easier to interpret.
    scale, reg = pipe.named_steps["scale"], pipe.named_steps["reg"]
    raw_coef = reg.coef_ / scale.scale_
    raw_intercept = float(reg.intercept_ - np.sum(reg.coef_ * scale.mean_ / scale.scale_))

    meta = {
        "model_type": "Ridge regression (StandardScaler + Ridge, alpha=1.0)",
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_source": str(data_path.name),
        "n_train": int(len(X_tr)),
        "n_test": int(len(X_te)),
        "target": f"{TARGET} (USD)",
        "features": FEATURE_NAMES,
        "coefficients": {n: float(c) for n, c in zip(FEATURE_NAMES, raw_coef)},
        "standardized_coefficients": {n: float(c) for n, c in zip(FEATURE_NAMES, reg.coef_)},
        "intercept": raw_intercept,
        # Used by the UI to show how each feature moves the price relative to an average house.
        "feature_means": {n: float(m) for n, m in zip(FEATURE_NAMES, X_tr.mean())},
        "baseline_price": float(y_tr.mean()),
        "metrics": {
            "r2": float(r2_score(y_te, pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_te, pred))),
            "mae": float(mean_absolute_error(y_te, pred)),
            "cv_r2_mean": float(cross_val_score(pipe, X, y, cv=5, scoring="r2").mean()),
        },
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipe, "meta": meta}, out)
    return meta


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(DEFAULT_DATA))
    args = ap.parse_args()
    print(json.dumps(train(Path(args.data)), indent=2))
