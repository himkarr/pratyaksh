import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..core.config import CONTRACTS
from ..core.security import issue_token

router = APIRouter(prefix="/auth", tags=["auth"])
class Login(BaseModel): user_id: str
@router.post("/login")
def login(body: Login):
    users = json.loads((CONTRACTS / "sample-data/sample_users.json").read_text())
    user = next((item for item in users if item["id"] == body.user_id), None)
    if not user: raise HTTPException(404, "Synthetic user not found")
    return {"access_token": issue_token(user), "token_type": "bearer"}
