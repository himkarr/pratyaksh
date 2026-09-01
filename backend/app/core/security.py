from datetime import datetime, timedelta, timezone
import jwt
from .config import JWT_ALGORITHM, JWT_SECRET

def issue_token(user: dict) -> str:
    payload = {"sub": user["id"], "role": user["role"], "state": user.get("state"), "district": user.get("district"), "constituency_code": user.get("constituency_code"), "exp": datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
