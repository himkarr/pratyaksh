FROM python:3.12-slim
WORKDIR /app
COPY ai-ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ai-ml/data ./data
COPY ai-ml/rule_engine ./rule_engine
COPY ai-ml/models ./models
COPY ai-ml/pipeline ./pipeline
COPY ai-ml/service ./service
CMD ["uvicorn", "service.ml_api:app", "--host", "0.0.0.0", "--port", "8001"]
