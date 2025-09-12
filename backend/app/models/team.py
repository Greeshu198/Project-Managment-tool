import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

# No other imports are needed here

class TeamRoleEnum(enum.Enum):
    admin = "admin"
    manager = "manager"
    member = "member"

class InvitationStatusEnum(enum.Enum):
    pending = "pending"
    accepted = "accepted"

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    owner = relationship("User", back_populates="owned_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="team", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('name', 'owner_id', name='_team_name_owner_uc'),
    )

class TeamMember(Base):
    __tablename__ = "team_members"

    # --- THIS IS THE FINAL, CRUCIAL FIX ---
    # This line tells the database that 'id' is the primary key and
    # should be an auto-incrementing integer (SERIAL), which is the
    # "auto-increment feature" you requested.
    id = Column(Integer, primary_key=True, index=True)
    # --- END FIX ---

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    team_id = Column(Integer, ForeignKey('teams.id'), nullable=False)
    role = Column(Enum(TeamRoleEnum), nullable=False, default=TeamRoleEnum.member)
    status = Column(Enum(InvitationStatusEnum), nullable=False, default=InvitationStatusEnum.pending)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="teams")
    team = relationship("Team", back_populates="members")