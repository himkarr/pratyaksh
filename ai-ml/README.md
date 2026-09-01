# AI/ML service

Run the MVP independently: `pip install -r requirements.txt && python data/synthetic_data_generator.py && python pipeline/train.py`.
Start its internal API with `uvicorn service.ml_api:app --port 8001 --reload`. It accepts synthetic project-shaped JSON and returns transparent rule, ML, and deadline-risk signals.
