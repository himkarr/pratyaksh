from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[3]
CONTRACTS = ROOT / "contracts"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{ROOT / 'mplad_demo.db'}")
JWT_SECRET = os.getenv("JWT_SECRET", "demo-only-secret-change-me-before-deployment-2026")
JWT_ALGORITHM = "HS256"
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")
