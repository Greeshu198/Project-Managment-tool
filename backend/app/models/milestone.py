import enum
# 1. Import 'Enum' from sqlalchemy alongside the other types
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class MilestoneStatusEnum(enum.Enum):
    upcoming = "upcoming"
    in_progress = "in_progress"
    completed = "completed"

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False)
    
    # 2. This line will now work correctly because 'Enum' is imported
    status = Column(Enum(MilestoneStatusEnum), nullable=False, default=MilestoneStatusEnum.upcoming)

    # Foreign Key to the project this milestone belongs to
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    # Relationship back to the project
    project = relationship("Project", back_populates="milestones")

