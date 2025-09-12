from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    is_active = Column(Boolean, default=False)
    otp = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)

    # --- TEAM RELATIONSHIPS ---
    owned_teams = relationship("Team", back_populates="owner", foreign_keys="[Team.owner_id]")
    teams = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")

    # --- PROJECT/TASK RELATIONSHIPS ---
    tasks_assigned = relationship("Task", back_populates="assignee", foreign_keys="[Task.assignee_id]")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="uploader", foreign_keys="[Attachment.uploader_id]")

    # --- NEW: FRIENDSHIP RELATIONSHIPS ---
    sent_friend_requests = relationship(
        "Friendship",
        foreign_keys="[Friendship.requester_id]",
        back_populates="requester",
        cascade="all, delete-orphan"
    )
    received_friend_requests = relationship(
        "Friendship",
        foreign_keys="[Friendship.addressee_id]",
        back_populates="addressee",
        cascade="all, delete-orphan"
    )

