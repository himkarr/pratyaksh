from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .security import verify_token
bearer = HTTPBearer(); PERMISSIONS = {"mp":{"projects:read","flags:read"},"state_nodal":{"projects:read","flags:read"},"district":{"projects:read","flags:read"},"ministry":{"projects:read","flags:read","audit:read"}}
def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try: return verify_token(credentials.credentials)
    except Exception as exc: raise HTTPException(401,"Invalid or expired token") from exc
def require(permission):
    def check(user=Depends(current_user)):
        if permission not in PERMISSIONS.get(user["role"],set()): raise HTTPException(403,"Permission denied")
        return user
    return check
def scoped(query, model, user):
    if user["role"] == "mp": return query.where(model.constituency_code == user["constituency_code"])
    if user["role"] == "state_nodal": return query.where(model.state == user["state"])
    if user["role"] == "district": return query.where(model.district == user["district"])
    return query
