# Housing Portal

**Task 1** – Housing price prediction API (FastAPI + scikit-learn, Dockerised)
**Task 2** – Next.js portal hosting two apps that both call the Task 1 model:

| App | Frontend | Backend | Port |
|---|---|---|---|
| Value Estimator | Next.js `/estimator` | Python 3.12 / FastAPI (`portal/estimator-api`) | 8001 |
| Market Analysis | Next.js `/market` | Java 21 / Spring Boot 3.4.4 (`portal/market-api`) | 8002 |
| Model API (Task 1) | – | Python 3.12 / FastAPI / scikit-learn (`model-api`) | 8000 |
| Portal | Next.js 14 App Router | – | 3000 |

```
browser ──► Next.js (3000) ──rewrites──► estimator-api (8001, Python) ──┐
                         └─────────────► market-api   (8002, Java)   ──┴──► model-api (8000, Task 1)
                                              data/housing.csv ◄── shared dataset
```

## Dataset (read this first)

Schema used throughout (matches "house price dataset.csv"):
`id, square_footage, bedrooms, bathrooms, year_built, lot_size, distance_to_city_centre, school_rating, price`
(`id` is only a row key; `price` is the target in USD.)

`data/housing.csv` currently holds a **synthetic stand-in** because the real file was not available when this was built.
Load the real one (header names are normalised, so spacing/case differences are fine):

```bash
python scripts/prepare_data.py --source "house price dataset.csv"
```

Assumed units, shown in the UI and used for validation ranges: square footage and lot size in sq ft, distance in km,
school rating 0–10. If your data differs, adjust the ranges in `model-api/app/features.py`, `model-api/app/schemas.py`,
`portal/estimator-api/app/main.py` and `portal/web/src/lib/features.ts`.

## Run everything with Docker

```bash
python scripts/prepare_data.py     # real data first
docker compose up --build
# Portal: http://localhost:3000   Swagger (Task 1): http://localhost:8000/docs
```

## Run without Docker

```bash
# Task 1
cd model-api && pip install -r requirements.txt
python train.py                     # writes artifacts/model.joblib
uvicorn app.main:app --port 8000    # Swagger at http://localhost:8000/docs
pytest tests

# Estimator backend
cd portal/estimator-api && pip install -r requirements.txt
MODEL_API_URL=http://localhost:8000 uvicorn app.main:app --port 8001

# Market backend (Java 21 + Maven)
cd portal/market-api && mvn spring-boot:run     # uses ../../data/housing.csv

# Frontend
cd portal/web && npm install && npm run dev     # http://localhost:3000
```

## Task 1 – API

* `POST /predict` – one property `{square_footage, bedrooms, ...}` **or** a batch `{"instances": [{...}, {...}]}`. Inputs are range-validated (422 on bad input).
* `GET /model-info` – coefficients (original units), intercept, R²/RMSE/MAE (hold-out) and 5-fold CV R².
* `GET /health` – liveness and whether the model is loaded.
* Model: `StandardScaler → Ridge`, chosen because the brief asks for coefficients. Trained at Docker build time.

Example: `curl -X POST localhost:8000/predict -H 'content-type: application/json' -d '{"square_footage":1850,"bedrooms":3,"bathrooms":2,"year_built":1995,"lot_size":6500,"distance_to_city_centre":8.5,"school_rating":7.2}'`

## Task 2 – how requirements map to code

**Portal structure**: shared header + sub-navs (`app/layout.tsx`, `app/estimator/layout.tsx`, `app/market/layout.tsx`); App Router; one design system (`components/ui.tsx`); `loading.tsx` / `error.tsx` at root and per app, `template.tsx` for page transitions.

**App 1 (Python)**: form with zod + react-hook-form and server-error mapping (`PropertyForm.tsx`); results as table + chart of each feature's effect versus an average house (`ResultView.tsx`); history persisted in SQLite (`estimator-api`); comparison basket (zustand) and side-by-side view (`CompareView.tsx`, `POST /api/compare`).

**App 2 (Java)**: dashboard with segment charts (size, year built, distance, schools) and filters in the URL (`MarketDashboard.tsx`, `FilterBar.tsx`); what-if tool (`WhatIfTool.tsx` → `POST /api/market/what-if` → model); CSV export (server) and PDF export (jsPDF, client); sortable, filterable, paginated table (filters: price, size, bedrooms, year, school rating, distance) (`market/properties/page.tsx`); Caffeine caching on summaries, segments, what-if and model-info.

**Next.js practices**: server components fetch initial data (`lib/server-api.ts`, `server-only`); client components only where interaction is needed; custom hooks in `src/hooks`; React Query for client fetching and mutations; accessibility: skip link, labelled inputs with `aria-describedby`/`aria-invalid`, `aria-sort`, `aria-current`, chart text alternatives, reduced-motion support.

## Verification status

The following checks have been run in the supplied environment:

- Model API unit tests: **5 passed**.
- Estimator API tests (history create/list/clear, compare, and validation): **4 passed**.
- Python source compilation: passed.
- Model training: passed on the included 5,000-row synthetic stand-in dataset.
- Model API smoke checks: `/health`, single prediction, batch prediction, `/model-info`, and invalid-input 422 response all passed.

The Java tests and full Next.js typecheck/build have not been executed in this environment: Maven is not installed and npm package installation could not complete. Docker is also unavailable here, so the multi-container deployment has not been launched end-to-end. Run `./scripts/verify.sh` in an environment with Maven and Node dependencies installed, then `docker compose up --build` to complete those checks.

**Dataset note:** the ZIP contains a synthetic stand-in `data/housing.csv`, not the original real-world housing dataset mentioned in the assignment. The reported model metrics are therefore demonstration metrics only. Replace it with the actual dataset using the `prepare_data.py --source` command above and retrain before presenting predictions as real market estimates.

## Verification helper

```bash
./scripts/verify.sh
```

This runs Python compilation/tests and retrains the model, then runs Java and frontend checks when their toolchains/dependencies are available.
