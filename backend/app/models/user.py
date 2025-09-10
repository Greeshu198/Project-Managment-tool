import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

# Enum for user roles within a team
class RoleEnum(enum.Enum):
    admin = "admin"
    manager = "manager"
    member = "member"

# Association table for the many-to-many relationship between users and teams
class TeamMember(Base):
    __tablename__ = 'team_members'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    team_id = Column(Integer, ForeignKey('teams.id'), primary_key=True)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.member)

    user = relationship("User", back_populates="teams")
    team = relationship("Team", back_populates="members")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password = Column(String, nullable=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    is_active = Column(Boolean, default=False, nullable=False)
    otp = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)

    # --- COLUMNS FOR RESEND LOGIC ---
    otp_sent_at = Column(DateTime(timezone=True), nullable=True)
    otp_attempts = Column(Integer, default=0, nullable=False)
    # --- END COLUMNS ---

    # Relationships
    teams = relationship("TeamMember", back_populates="user")
    tasks_assigned = relationship("Task", back_populates="assignee", foreign_keys="[Task.assignee_id]")
    owned_teams = relationship("Team", back_populates="owner")
    comments = relationship("Comment", back_populates="user")
    attachments = relationship("Attachment", back_populates="uploader")