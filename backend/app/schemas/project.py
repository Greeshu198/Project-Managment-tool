from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.project import ProjectStatusEnum
from .milestone import Milestone # 1. Import the new Milestone schema

# Base schema with common project attributes
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: ProjectStatusEnum = ProjectStatusEnum.active

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[ProjectStatusEnum] = None

# Full schema for representing a project in API responses
class Project(ProjectBase):
    id: int
    team_id: int
    created_at: datetime
    tasks: List = []
    milestones: List[Milestone] = [] # 2. Add milestones to the response model

    model_config = ConfigDict(from_attributes=True)

