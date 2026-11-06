from __future__ import annotations

from pydantic import BaseModel, Field


class HouseFeatures(BaseModel):
    """One property. Ranges mirror app.features and are enforced here (422 on violation)."""
    square_footage: float = Field(ge=200, le=20000, examples=[1850])
    bedrooms: float = Field(ge=0, le=15, examples=[3])
    bathrooms: float = Field(ge=0.5, le=12, examples=[2])
    year_built: float = Field(ge=1800, le=2026, examples=[1995])
    lot_size: float = Field(ge=0, le=200000, examples=[6500])
    distance_to_city_centre: float = Field(ge=0, le=200, examples=[8.5])
    school_rating: float = Field(ge=0, le=10, examples=[7.2])


class BatchRequest(BaseModel):
    instances: list[HouseFeatures] = Field(min_length=1, max_length=1000)


class Prediction(BaseModel):
    predicted_price_usd: float


class PredictResponse(BaseModel):
    count: int
    predictions: list[Prediction]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
