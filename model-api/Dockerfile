# Build from the repository root:  docker build -f model-api/Dockerfile -t housing-model-api .
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

COPY model-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY model-api/ ./
COPY data/ ./data/
# Train at build time so the image ships with a ready model.
RUN python train.py --data data/housing.csv > /dev/null \
    && useradd -r app && chown -R app /srv
USER app

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
