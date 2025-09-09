from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign Key to the user who owns/created the team
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    # The user object of the owner
    owner = relationship("User", back_populates="owned_teams")
    
    # The list of members in this team (via the association table)
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    
    # The list of projects belonging to this team
    projects = relationship("Project", back_populates="team", cascade="all, delete-orphan")