"""Feature definitions shared by training and the API (single source of truth)."""
from __future__ import annotations

from typing import NamedTuple


class Feature(NamedTuple):
    name: str
    label: str
    minimum: float
    maximum: float
    description: str


FEATURES: list[Feature] = [
    Feature("square_footage", "Living area", 200, 20000, "Interior living area in square feet"),
    Feature("bedrooms", "Bedrooms", 0, 15, "Number of bedrooms"),
    Feature("bathrooms", "Bathrooms", 0.5, 12, "Number of bathrooms (0.5 = half bath)"),
    Feature("year_built", "Year built", 1800, 2026, "Year the house was built"),
    Feature("lot_size", "Lot size", 0, 200000, "Lot size in square feet"),
    Feature("distance_to_city_centre", "Distance to city centre", 0, 200, "Distance to the city centre in km"),
    Feature("school_rating", "School rating", 0, 10, "Local school rating, 0 (worst) to 10 (best)"),
]
FEATURE_NAMES = [f.name for f in FEATURES]
TARGET = "price"  # USD
