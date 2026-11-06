"""Loads the trained pipeline and does the predicting. No web framework in here."""
from __future__ import annotations

from pathlib import Path
from typing import Sequence

import joblib
import pandas as pd

from .features import FEATURE_NAMES
from .schemas import HouseFeatures, Prediction


class ModelService:
    def __init__(self, path: Path):
        bundle = joblib.load(path)
        self._pipeline = bundle["pipeline"]
        self.meta: dict = bundle["meta"]

    def predict(self, items: Sequence[HouseFeatures]) -> list[Prediction]:
        frame = pd.DataFrame([i.model_dump() for i in items], columns=FEATURE_NAMES)
        raw = self._pipeline.predict(frame)
        # House values are never negative; clamp so a wild input can't return nonsense.
        return [Prediction(predicted_price_usd=round(max(float(v), 0.0), 2)) for v in raw]
