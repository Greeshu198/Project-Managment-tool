from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List

from app import models, schemas
from app.db import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/search", response_model=List[schemas.User])
def search_users(
    username: str = Query(..., min_length=2, description="Search term for username"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Searches for users by username.
    """
    users = db.query(models.User).filter(
        models.User.username.ilike(f"%{username}%"),
        models.User.id != current_user.id
    ).limit(10).all()
    return users

@router.post("/request", response_model=schemas.Friendship, status_code=status.HTTP_201_CREATED)
def send_friend_request(request: schemas.FriendRequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Sends a friend request to another user."""
    # ... (existing code is correct)
    if request.addressee_username == current_user.username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot send a friend request to yourself.")
    addressee = db.query(models.User).filter(models.User.username == request.addressee_username).first()
    if not addressee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{request.addressee_username}' not found.")
    existing_friendship = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == current_user.id) & (models.Friendship.addressee_id == addressee.id),
            (models.Friendship.requester_id == addressee.id) & (models.Friendship.addressee_id == current_user.id)
        )
    ).first()
    if existing_friendship:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A friend request already exists between you and this user.")
    db_friendship = models.Friendship(requester_id=current_user.id, addressee_id=addressee.id)
    db.add(db_friendship)
    db.commit()
    db.refresh(db_friendship)
    return db_friendship


@router.get("/requests/pending", response_model=List[schemas.PendingFriendRequest])
def get_pending_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Gets a list of pending friend requests."""
    return db.query(models.Friendship).filter(
        models.Friendship.addressee_id == current_user.id,
        models.Friendship.status == models.FriendshipStatusEnum.pending
    ).all()

@router.post("/requests/{friendship_id}/respond", response_model=schemas.Friendship)
def respond_to_friend_request(friendship_id: int, response: schemas.FriendRequestResponse, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Accepts or declines a pending friend request."""
    # ... (existing code is correct)
    db_request = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        models.Friendship.addressee_id == current_user.id,
        models.Friendship.status == models.FriendshipStatusEnum.pending
    ).first()
    if not db_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending friend request not found.")
    if response.accept:
        db_request.status = models.FriendshipStatusEnum.accepted
        db.commit()
        db.refresh(db_request)
        return db_request
    else:
        db.delete(db_request)
        db.commit()
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/", response_model=List[schemas.User])
def get_friends_list(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Gets a list of all accepted friends."""
    # ... (existing code is correct)
    friendships = db.query(models.Friendship).filter(
        or_(models.Friendship.requester_id == current_user.id, models.Friendship.addressee_id == current_user.id),
        models.Friendship.status == models.FriendshipStatusEnum.accepted
    ).all()
    friends = []
    for friendship in friendships:
        if friendship.requester_id == current_user.id:
            friends.append(friendship.addressee)
        else:
            friends.append(friendship.requester)
    return friends

# --- NEW: Endpoint to Remove a Friend ---
@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(friend_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Removes a friendship connection.
    This will delete the friendship record regardless of who initiated it.
    """
    # Find the friendship record between the current user and the specified friend_id
    friendship_to_delete = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == current_user.id) & (models.Friendship.addressee_id == friend_id),
            (models.Friendship.requester_id == friend_id) & (models.Friendship.addressee_id == current_user.id)
        ),
        models.Friendship.status == models.FriendshipStatusEnum.accepted
    ).first()

    if not friendship_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found.")

    db.delete(friendship_to_delete)
    db.commit()

