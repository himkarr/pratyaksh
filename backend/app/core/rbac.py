from typing import List, Optional
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.session import get_db
from .security import verify_token
from ..models import User, Role, AgencyUser, VerificationRequest

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Extract and validate the authenticated user and resolve their role from the roles table.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.execute(
        select(User).join(Role).where(User.user_id == user_uuid)
    ).scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status}"
        )

    return user

def require_roles(allowed_roles: List[str]):
    """
    Dependency to enforce that the authenticated user possesses one of the allowed roles.
    Admin bypasses all role checks (superuser).
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.role_name
        if user_role not in allowed_roles and user_role != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Role '{user_role}' is not authorized for this resource"
            )
        return current_user
    return role_checker

def filter_projects_by_role(query, current_user: User, db: Session):
    """
    Filters a Project SQLAlchemy query according to the user's role scope:
    - MPUser: see only their own projects (mp_id == user.user_id)
    - DistrictAuthority: see only their district (district == user.district)
    - StateNodalAuthority: see only their state (state == user.state)
    - FieldOfficer: see only projects where they are assigned in verification_requests
    - Vendor: see only their implementing agency's projects
    - MinistryUser / Admin: see everything
    - Citizen: prohibited from direct internal project queries (must use /projects/public)
    """
    from ..models import Project
    role = current_user.role.role_name

    if role in ("MinistryUser", "Admin"):
        return query
    elif role == "MPUser":
        return query.where(Project.mp_id == current_user.user_id)
    elif role == "DistrictAuthority":
        if not current_user.district:
            return query.where(Project.district == "__UNSET__")
        return query.where(Project.district == current_user.district)
    elif role == "StateNodalAuthority":
        if not current_user.state:
            return query.where(Project.state == "__UNSET__")
        return query.where(Project.state == current_user.state)
    elif role == "FieldOfficer":
        # Find projects where this officer has an assigned verification request
        assigned_proj_subquery = select(VerificationRequest.project_id).where(
            VerificationRequest.assigned_officer_id == current_user.user_id
        )
        return query.where(Project.project_id.in_(assigned_proj_subquery))
    elif role == "Vendor":
        # Find agency_id for this vendor user
        agency_subquery = select(AgencyUser.agency_id).where(
            AgencyUser.user_id == current_user.user_id
        )
        return query.where(Project.implementing_agency_id.in_(agency_subquery))
    elif role == "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizens must use the public projects endpoint (/projects/public)"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized role"
        )
