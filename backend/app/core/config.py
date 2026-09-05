from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[3]

# Supabase PostgreSQL Connection URL (using IPv4 transaction/session pooler for high reliability)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres.kslsyhrrfnshbdujzhdr:Mplads2026Password!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
)

# Supabase API and Storage Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kslsyhrrfnshbdujzhdr.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHN5aHJyZm5zaGJkdWp6aGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyMjc3MCwiZXhwIjoyMTAzOTk4NzcwfQ.Dg9q_NvF65haWgygslmN3cQbGvy0VWriF_3J6hpwTVI"
)
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHN5aHJyZm5zaGJkdWp6aGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjI3NzAsImV4cCI6MjEwMzk5ODc3MH0.lbkMwORKsGcdAq_3v-sQcubeeI0WO8fEWb7zCOyjaqY"
)
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "evidence-files")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "mospi-mplads-sih2026-sapphire-secret-jwt-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
