from data.synthetic_data_generator import generate
from models.isolation_forest_model import train as train_isolation
from models.deadline_forecaster import train as train_deadline
from pipeline.predict import predict
def test_predict_returns_contract_shape():
    records = generate(30); train_isolation(records); train_deadline(records); flags = predict(next(record for record in records if record["synthetic_label"] == "anomaly")); assert flags and {"id","project_id","reason","origin","created_at"}.issubset(flags[0])
