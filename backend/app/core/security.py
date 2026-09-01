from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from .config import JWT_ALGORITHM, JWT_SECRET
passwords = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str) -> str: return passwords.hash(password)
def verify_password(password: str, hashed: str) -> bool: return passwords.verify(password, hashed)
def issue_token(user) -> str:
    payload = {"sub": user.id, "role": user.role, "state": user.state, "district": user.district, "constituency_code": user.constituency_code, "exp": datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
def verify_token(token: str) -> dict: return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
