import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

# Enum for user roles within a team
class RoleEnum(enum.Enum):
    admin = "admin"
    manager = "manager"
    member = "member"

# Association table for the many-to-many relationship between users and teams
# THIS IS THE CLASS THAT WAS MISSING FROM YOUR FILE
class TeamMember(Base):
    __tablename__ = 'team_members'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    team_id = Column(Integer, ForeignKey('teams.id'), primary_key=True)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.member)

    # Relationships to easily access User and Team objects from this association
    user = relationship("User", back_populates="teams")
    team = relationship("Team", back_populates="members")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password = Column(String, nullable=False) # Hashed password
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # A user can be part of many teams with different roles
    teams = relationship("TeamMember", back_populates="user")
    
    # A user can be assigned many tasks
    tasks_assigned = relationship("Task", back_populates="assignee", foreign_keys="[Task.assignee_id]")
    
    # A user can own many teams
    owned_teams = relationship("Team", back_populates="owner")
    
    # A user can create many comments
    comments = relationship("Comment", back_populates="user")
    
    # A user can upload many attachments
    attachments = relationship("Attachment", back_populates="uploader")