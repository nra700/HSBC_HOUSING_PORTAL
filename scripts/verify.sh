#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python -m compileall -q model-api portal/estimator-api scripts
python -m pytest model-api/tests -q
PYTHONPATH=portal/estimator-api python -m pytest portal/estimator-api/tests -q
python model-api/train.py --data data/housing.csv

if command -v mvn >/dev/null 2>&1; then
  (cd portal/market-api && mvn test)
else
  echo "SKIP: Maven is not installed; Java tests were not run." >&2
fi

if [[ -d portal/web/node_modules ]]; then
  (cd portal/web && npm run typecheck && npm run build)
else
  echo "SKIP: portal/web/node_modules is missing; run npm install, then npm run typecheck and npm run build." >&2
fi
