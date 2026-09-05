import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.session import get_db
from ..models import User, Role
from ..core.security import hash_password, verify_password, issue_token
from ..core.rbac import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role_name: str
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str]
    role: str
    role_id: str
    district: Optional[str]
    state: Optional[str]
    status: str
    aadhaar_verified: bool

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

@router.post("/register", response_model=LoginResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.execute(select(User).where(User.email == req.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Resolve role_id from roles table
    role = db.execute(select(Role).where(Role.role_name == req.role_name)).scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{req.role_name}' does not exist"
        )
    
    new_user = User(
        user_id=uuid.uuid4(),
        name=req.name,
        email=req.email,
        phone=req.phone,
        password_hash=hash_password(req.password),
        role_id=role.role_id,
        status="active",
        district=req.district,
        state=req.state,
        aadhaar_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_claims = {
        "sub": str(new_user.user_id),
        "email": new_user.email,
        "name": new_user.name,
        "role": role.role_name,
        "role_id": str(role.role_id),
        "district": new_user.district,
        "state": new_user.state,
        "constituency_id": str(new_user.constituency_id) if new_user.constituency_id else None
    }
    token = issue_token(token_claims)

    return LoginResponse(
        access_token=token,
        user=UserProfileResponse(
            user_id=str(new_user.user_id),
            name=new_user.name,
            email=new_user.email,
            phone=new_user.phone,
            role=role.role_name,
            role_id=str(role.role_id),
            district=new_user.district,
            state=new_user.state,
            status=new_user.status,
            aadhaar_verified=new_user.aadhaar_verified
        )
    )

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Join with roles table to resolve role
    user = db.execute(
        select(User).join(Role).where(User.email == req.email)
    ).scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_claims = {
        "sub": str(user.user_id),
        "email": user.email,
        "name": user.name,
        "role": user.role.role_name,
        "role_id": str(user.role.role_id),
        "district": user.district,
        "state": user.state,
        "constituency_id": str(user.constituency_id) if user.constituency_id else None
    }
    token = issue_token(token_claims)

    return LoginResponse(
        access_token=token,
        user=UserProfileResponse(
            user_id=str(user.user_id),
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role.role_name,
            role_id=str(user.role.role_id),
            district=user.district,
            state=user.state,
            status=user.status,
            aadhaar_verified=user.aadhaar_verified
        )
    )

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        user_id=str(current_user.user_id),
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role.role_name,
        role_id=str(current_user.role.role_id),
        district=current_user.district,
        state=current_user.state,
        status=current_user.status,
        aadhaar_verified=current_user.aadhaar_verified
    )

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """
    Returns the list of seeded demo users across all 8 roles for rapid UI testing and demonstration.
    """
    users = db.execute(select(User).join(Role).order_by(Role.role_name)).scalars().all()
    demo_list = []
    for u in users:
        demo_list.append({
            "user_id": str(u.user_id),
            "name": u.name,
            "email": u.email,
            "role": u.role.role_name,
            "district": u.district,
            "state": u.state,
            "default_password": "demo1234"
        })
    return demo_list
