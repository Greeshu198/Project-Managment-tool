import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class ProjectStatusEnum(enum.Enum):
    active = "active"
    completed = "completed"
    on_hold = "on_hold"
    cancelled = "cancelled"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatusEnum), nullable=False, default=ProjectStatusEnum.active)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign Key to the team that this project belongs to
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    # Relationships
    # The team object this project belongs to
    team = relationship("Team", back_populates="projects")
    
    # The list of tasks within this project
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")