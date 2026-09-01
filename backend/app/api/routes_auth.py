from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.user import User
from ..core.security import issue_token, verify_password
router=APIRouter(prefix="/auth",tags=["auth"])
class Login(BaseModel): email:str; password:str
@router.post("/login")
def login(body:Login, db:Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==body.email))
    if not user or not verify_password(body.password,user.password_hash): raise HTTPException(401,"Invalid credentials")
    return {"access_token":issue_token(user),"token_type":"bearer","role":user.role}
