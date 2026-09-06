"""Runtime configuration. Secrets are supplied through environment variables."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

# The default is only for the local Docker stack. Production must set DATABASE_URL.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://mplad:mplad@db:5432/mplad")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "evidence-files")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "")

JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
