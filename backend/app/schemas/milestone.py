from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.milestone import MilestoneStatusEnum

# Base schema with common milestone attributes
class MilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: datetime
    status: MilestoneStatusEnum = MilestoneStatusEnum.upcoming

# Schema used when creating a new milestone
class MilestoneCreate(MilestoneBase):
    pass

# Schema for updating an existing milestone (all fields are optional)
class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[MilestoneStatusEnum] = None

# Full schema for representing a milestone in API responses
class Milestone(MilestoneBase):
    id: int
    project_id: int

    model_config = ConfigDict(from_attributes=True)

