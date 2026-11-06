import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.model_service import ModelService  # noqa: E402
from app.schemas import BatchRequest, HouseFeatures  # noqa: E402
from train import train  # noqa: E402

SAMPLE = dict(square_footage=1850, bedrooms=3, bathrooms=2, year_built=1995, lot_size=6500,
              distance_to_city_centre=8.5, school_rating=7.2)


@pytest.fixture(scope="module")
def service(tmp_path_factory):
    out = tmp_path_factory.mktemp("m") / "model.joblib"
    train(ROOT.parent / "data" / "housing.csv", out)
    return ModelService(out)


def test_single_and_batch(service):
    one = service.predict([HouseFeatures(**SAMPLE)])
    assert len(one) == 1 and one[0].predicted_price_usd > 0
    batch = BatchRequest(instances=[SAMPLE, {**SAMPLE, "square_footage": 3500}]).instances
    small, big = service.predict(batch)
    assert big.predicted_price_usd > small.predicted_price_usd  # more space, higher price


def test_model_info(service):
    m = service.meta
    assert set(m["coefficients"]) == set(SAMPLE) == set(m["feature_means"])
    assert 0 < m["metrics"]["r2"] <= 1


@pytest.mark.parametrize("field,value", [("square_footage", -5), ("school_rating", 11), ("year_built", 1500)])
def test_validation_rejects_out_of_range(field, value):
    with pytest.raises(ValidationError):
        HouseFeatures(**{**SAMPLE, field: value})
