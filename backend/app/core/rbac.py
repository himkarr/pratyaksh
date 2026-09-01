from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .security import verify_token

bearer = HTTPBearer()
PERMISSIONS = {"mp": {"projects:read", "flags:read"}, "state_nodal": {"projects:read", "flags:read"}, "district": {"projects:read", "flags:read"}, "ministry": {"projects:read", "flags:read", "audit:read"}}

def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try: return verify_token(credentials.credentials)
    except Exception as exc: raise HTTPException(401, "Invalid or expired token") from exc

def require(permission: str):
    def check(user: dict = Depends(current_user)):
        if permission not in PERMISSIONS.get(user["role"], set()): raise HTTPException(403, "Permission denied")
        return user
    return check

def scope_projects(projects: list[dict], user: dict) -> list[dict]:
    if user["role"] == "ministry": return projects
    field = "constituency_code" if user["role"] == "mp" else "state" if user["role"] == "state_nodal" else "district"
    return [project for project in projects if project.get(field) == user.get(field)]
