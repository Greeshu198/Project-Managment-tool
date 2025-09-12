import enum
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class FriendshipStatusEnum(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    blocked = "blocked" # For future features like blocking users

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)

    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(FriendshipStatusEnum), nullable=False, default=FriendshipStatusEnum.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships back to the User model
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_friend_requests")
    addressee = relationship("User", foreign_keys=[addressee_id], back_populates="received_friend_requests")

    # Ensures a user can't send a request to the same person twice
    __table_args__ = (
        UniqueConstraint('requester_id', 'addressee_id', name='_requester_addressee_uc'),
    )