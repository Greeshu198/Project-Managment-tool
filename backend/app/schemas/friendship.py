from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.models.friendship import FriendshipStatusEnum
from .user import User # Import the full User schema for display

class FriendRequestCreate(BaseModel):
    """Schema for sending a friend request to a username."""
    addressee_username: str

class FriendRequestResponse(BaseModel):
    """Schema for responding to a friend request."""
    accept: bool

class Friendship(BaseModel):
    """Schema for displaying a full friendship object."""
    id: int
    requester: User
    addressee: User
    status: FriendshipStatusEnum
    model_config = ConfigDict(from_attributes=True)

class PendingFriendRequest(BaseModel):
    """Schema for displaying a pending request to the current user."""
    id: int
    requester: User # Show who sent the request
    status: FriendshipStatusEnum
    model_config = ConfigDict(from_attributes=True)
