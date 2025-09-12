# app/api/v1/routers/projects.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.db import get_db
from app.core.security import get_current_user

from app.api.v1.teams import get_team_and_check_permissions

router = APIRouter()

# --- Project Endpoints ---

@router.post("/teams/{team_id}/projects", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project_for_team(
    team_id: int,
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a new project within a specific team.
    Requires the current user to be an admin of the team.
    """
    # MODIFIED: Changed required_role to "admin"
    team, _ = get_team_and_check_permissions(team_id, db, current_user, required_role="admin")
    db_project = models.Project(**project.model_dump(), team_id=team.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/teams/{team_id}/projects", response_model=List[schemas.Project])
def get_projects_for_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves all projects for a specific team.
    Requires the user to be a member of the team.
    """
    team, _ = get_team_and_check_permissions(team_id, db, current_user, required_role="member")
    return team.projects

@router.get("/{project_id}", response_model=schemas.Project)
def get_project_details(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves details for a specific project, including its milestones.
    Requires the user to be a member of the project's team.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    get_team_and_check_permissions(project.team_id, db, current_user, required_role="member")
    return project

@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Updates a project's details.
    Requires the user to be an admin of the project's team.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    # MODIFIED: Changed required_role to "admin"
    get_team_and_check_permissions(project.team_id, db, current_user, required_role="admin")
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes a project.
    Requires the user to be an admin of the project's team.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    # This was already "admin", no change needed
    get_team_and_check_permissions(project.team_id, db, current_user, required_role="admin")
    db.delete(project)
    db.commit()

# --- Milestone Endpoints ---

@router.post("/{project_id}/milestones", response_model=schemas.Milestone, status_code=status.HTTP_201_CREATED)
def create_milestone_for_project(
    project_id: int,
    milestone: schemas.MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a new milestone for a project.
    Requires the user to be an admin of the project's team.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    # MODIFIED: Changed required_role to "admin"
    get_team_and_check_permissions(project.team_id, db, current_user, required_role="admin")
    db_milestone = models.Milestone(**milestone.model_dump(), project_id=project_id)
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

@router.get("/{project_id}/milestones", response_model=List[schemas.Milestone])
def get_milestones_for_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves all milestones for a specific project.
    Requires the user to be a member of the project's team.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    get_team_and_check_permissions(project.team_id, db, current_user, required_role="member")
    return project.milestones

@router.put("/{project_id}/milestones/{milestone_id}", response_model=schemas.Milestone)
def update_milestone(
    project_id: int,
    milestone_id: int,
    milestone_update: schemas.MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Updates a milestone's details.
    Requires the user to be an admin of the project's team.
    """
    db_milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.project_id == project_id
    ).first()
    if not db_milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found in this project.")
    # MODIFIED: Changed required_role to "admin"
    get_team_and_check_permissions(db_milestone.project.team_id, db, current_user, required_role="admin")
    update_data = milestone_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_milestone, key, value)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

@router.delete("/{project_id}/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    project_id: int,
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes a milestone from a project.
    Requires the user to be an admin of the project's team.
    """
    db_milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.project_id == project_id
    ).first()
    if not db_milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found in this project.")
    # MODIFIED: Changed required_role to "admin"
    get_team_and_check_permissions(db_milestone.project.team_id, db, current_user, required_role="admin")
    db.delete(db_milestone)
    db.commit()