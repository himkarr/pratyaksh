import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from ..db.session import get_db
from ..models import Notification, User
from ..core.rbac import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, le=200),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve in-app notifications for the authenticated user.
    """
    query = select(Notification).where(Notification.user_id == current_user.user_id).order_by(Notification.created_at.desc())
    if unread_only:
        query = query.where(Notification.is_read == False)

    notifications = db.execute(query.limit(limit).offset(offset)).scalars().all()

    return [
        {
            "notification_id": str(n.notification_id),
            "channel": n.channel,
            "title": n.title,
            "message": n.message,
            "related_entity_type": n.related_entity_type,
            "related_entity_id": str(n.related_entity_id) if n.related_entity_id else None,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns unread notification count for frontend notification bell badges.
    """
    count = db.execute(
        select(func.count(Notification.notification_id)).where(
            and_(
                Notification.user_id == current_user.user_id,
                Notification.is_read == False
            )
        )
    ).scalar() or 0

    return {"unread_count": count}

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        n_uuid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid notification ID format")

    notif = db.execute(
        select(Notification).where(
            and_(
                Notification.notification_id == n_uuid,
                Notification.user_id == current_user.user_id
            )
        )
    ).scalar_one_or_none()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()

    return {"message": "Notification marked as read", "notification_id": str(notif.notification_id)}

@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = db.execute(
        select(Notification).where(
            and_(
                Notification.user_id == current_user.user_id,
                Notification.is_read == False
            )
        )
    ).scalars().all()

    for n in notifications:
        n.is_read = True

    db.commit()

    return {"message": f"Marked {len(notifications)} notifications as read"}
