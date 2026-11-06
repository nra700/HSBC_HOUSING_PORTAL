"""Create data/housing.csv, the single dataset shared by the model API and the Java backend.

Usage:
  python scripts/prepare_data.py --source "house price dataset.csv"   # your real file
  python scripts/prepare_data.py                                      # synthetic stand-in (demo only)

Expected columns (header names are normalised: lower-case, spaces -> underscores):
  id, square_footage, bedrooms, bathrooms, year_built, lot_size, distance_to_city_centre, school_rating, price
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

FEATURES = ["square_footage", "bedrooms", "bathrooms", "year_built", "lot_size",
            "distance_to_city_centre", "school_rating"]
COLUMNS = ["id", *FEATURES, "price"]
ALIASES = {"sqft": "square_footage", "square_ft": "square_footage", "square_feet": "square_footage",
           "square": "square_footage", "area": "square_footage", "distance_to_city_center": "distance_to_city_centre"}


def synthetic(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    sqft = np.clip(rng.lognormal(7.45, 0.35, n), 500, 8000).round()
    beds = np.clip(np.round(sqft / 600 + rng.normal(0, 0.8, n)), 1, 8)
    baths = np.clip(np.round((beds * 0.6 + rng.normal(1, 0.5, n)) * 2) / 2, 1, 6)
    year = rng.integers(1930, 2025, n)
    lot = np.clip(rng.lognormal(8.8, 0.6, n), 1500, 60000).round()
    dist = np.clip(rng.lognormal(2.0, 0.7, n), 0.5, 60).round(1)
    school = np.clip(rng.normal(6.5, 1.8, n), 1, 10).round(1)
    price = (40000 + 140 * sqft + 9000 * beds + 12000 * baths + 600 * (year - 1900)
             + 1.2 * lot - 3500 * dist + 14000 * school + rng.normal(0, 25000, n))
    return pd.DataFrame(dict(id=np.arange(1, n + 1), square_footage=sqft, bedrooms=beds, bathrooms=baths,
                             year_built=year, lot_size=lot, distance_to_city_centre=dist,
                             school_rating=school, price=np.clip(price, 50000, None).round()))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source")
    ap.add_argument("--out", default=str(Path(__file__).resolve().parents[1] / "data" / "housing.csv"))
    args = ap.parse_args()

    if args.source:
        df = pd.read_csv(args.source)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        df = df.rename(columns=ALIASES)
        label = f"file {args.source}"
        if "id" not in df.columns:
            df.insert(0, "id", range(1, len(df) + 1))
    else:
        print("WARNING: no --source given; writing a SYNTHETIC stand-in dataset (demo only).", file=sys.stderr)
        df, label = synthetic(), "SYNTHETIC stand-in"
    missing = [c for c in COLUMNS if c not in df.columns]
    if missing:
        sys.exit(f"Dataset is missing columns: {missing}. Found: {list(df.columns)}")
    before = len(df)
    df = df[COLUMNS].dropna()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} rows ({before - len(df)} dropped for missing values) to {out} from {label}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
