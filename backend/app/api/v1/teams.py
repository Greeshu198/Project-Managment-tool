from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

# Import the specific psycopg2 error code for NotNullViolation
from psycopg2.errors import NotNullViolation

from app import models, schemas
from app.db import get_db
from app.core.security import get_current_user
from app.utils import email

router = APIRouter()

# --- Helper function for permission checks ---
def get_team_and_check_permissions(team_id: int, db: Session, current_user: models.User, required_role: str = "member"):
    team_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == current_user.id
    ).first()
    if not team_member or team_member.status != models.InvitationStatusEnum.accepted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found or you are not a member.")
    if required_role == "admin" and team_member.role != models.TeamRoleEnum.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be an admin to perform this action.")
    if required_role == "manager" and team_member.role not in [models.TeamRoleEnum.admin, models.TeamRoleEnum.manager]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a manager or admin to perform this action.")
    if required_role == "owner":
        team = db.query(models.Team).filter(models.Team.id == team_id).first()
        if not team or team.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the team owner can perform this action.")
    return team_member.team, team_member

# --- Core Team Endpoints ---

@router.post("/", response_model=schemas.Team, status_code=status.HTTP_201_CREATED)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        db_team = models.Team(name=team.name, description=team.description, owner_id=current_user.id)
        db.add(db_team)
        db.flush()
        owner_membership = models.TeamMember(
            user_id=current_user.id,
            team_id=db_team.id,
            role=models.TeamRoleEnum.admin,
            status=models.InvitationStatusEnum.accepted
        )
        db.add(owner_membership)
        db.commit()
        db.refresh(db_team)
    except IntegrityError as e:
        db.rollback()
        if isinstance(e.orig, NotNullViolation):
            raise HTTPException(status_code=500, detail="Database schema error. Please run Alembic migrations.")
        elif "violates unique constraint" in str(e.orig):
             raise HTTPException(status_code=409, detail=f"You have already created a team with the name '{team.name}'.")
        else:
            raise HTTPException(status_code=500, detail=f"An unexpected database integrity error occurred: {e.orig}")
    return db_team

@router.get("/", response_model=List[schemas.Team])
def get_user_teams(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    memberships = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.status == models.InvitationStatusEnum.accepted
    ).all()
    return [membership.team for membership in memberships]

@router.get("/{team_id}", response_model=schemas.Team)
def get_team_details(team_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    team, _ = get_team_and_check_permissions(team_id, db, current_user)
    team.members = [m for m in team.members if m.status == models.InvitationStatusEnum.accepted]
    return team

# --- Invitation Endpoints ---

@router.get("/invitations/pending", response_model=List[schemas.TeamInvitation])
def get_pending_invitations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    pending_invites = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.status == models.InvitationStatusEnum.pending
    ).all()
    return pending_invites

@router.post("/invitations/{team_id}/respond", response_model=schemas.TeamMember)
def respond_to_invitation(team_id: int, response: schemas.InvitationResponse, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    invitation = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.status == models.InvitationStatusEnum.pending
    ).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found.")
    if response.accept:
        invitation.status = models.InvitationStatusEnum.accepted
        db.commit()
        db.refresh(invitation)
        return invitation
    else:
        db.delete(invitation)
        db.commit()
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)

# --- Member Management Endpoints ---

@router.post("/{team_id}/members", response_model=schemas.InvitationConfirmation, status_code=status.HTTP_201_CREATED)
def invite_team_member(team_id: int, invite: schemas.TeamInvite, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only admins can invite members
    team, _ = get_team_and_check_permissions(team_id, db, current_user, required_role="admin")
    
    invited_user = db.query(models.User).filter(models.User.email == invite.email).first()
    if invited_user:
        existing_membership = db.query(models.TeamMember).filter(
            models.TeamMember.team_id == team_id, 
            models.TeamMember.user_id == invited_user.id
        ).first()
        if existing_membership:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {invite.email} is already in this team.")
        
        new_invitation = models.TeamMember(
            user_id=invited_user.id, 
            team_id=team_id, 
            role=invite.role, 
            status=models.InvitationStatusEnum.pending
        )
        db.add(new_invitation)
        db.commit()
        background_tasks.add_task(
            email.send_invitation_to_existing_user, 
            recipient_email=invite.email, 
            inviter_name=current_user.full_name or current_user.username, 
            team_name=team.name, 
            role=invite.role.value
        )
        return {"message": f"Invitation sent to existing user {invite.email}."}
    else:
        background_tasks.add_task(
            email.send_invitation_to_new_user, 
            recipient_email=invite.email, 
            inviter_name=current_user.full_name or current_user.username, 
            team_name=team.name, 
            role=invite.role.value
        )
        return {"message": f"Invitation email sent to {invite.email}. They will need to sign up to join."}

# --- Remove Member from Team ---
@router.delete("/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(team_id: int, member_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only admins can remove members
    team, self_membership = get_team_and_check_permissions(team_id, db, current_user, required_role="admin")

    if member_id == team.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="The team owner cannot be removed.")
    
    if member_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove yourself. Use leave team functionality instead.")

    member_to_remove = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == member_id
    ).first()

    if not member_to_remove:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this team.")
    
    db.delete(member_to_remove)
    db.commit()

# --- Update Member Role ---
@router.put("/{team_id}/members/{member_id}/role", response_model=schemas.TeamMember)
def update_member_role(team_id: int, member_id: int, role_update: schemas.TeamMemberUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only admins can change roles
    team, self_membership = get_team_and_check_permissions(team_id, db, current_user, required_role="admin")
    
    if member_id == team.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="The team owner's role cannot be changed.")
    
    if member_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot change your own role.")

    member_to_update = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == member_id
    ).first()

    if not member_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this team.")
    
    member_to_update.role = role_update.role
    db.commit()
    db.refresh(member_to_update)
    return member_to_update

# --- Delete Team (Owner Only) ---
@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only team owner can delete the team
    _, _ = get_team_and_check_permissions(team_id, db, current_user, required_role="owner")
    
    team_to_delete = db.query(models.Team).filter(models.Team.id == team_id).first()
    
    if not team_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")
        
    db.delete(team_to_delete)
    db.commit()

# --- NEW: Get Current User's Role in Team ---
@router.get("/{team_id}/my-role", response_model=dict)
def get_my_role_in_team(team_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get the current user's role and permissions in a team"""
    team, team_member = get_team_and_check_permissions(team_id, db, current_user)
    
    is_owner = team.owner_id == current_user.id
    is_admin = team_member.role == models.TeamRoleEnum.admin
    
    return {
        "role": team_member.role.value,
        "is_owner": is_owner,
        "is_admin": is_admin,
        "permissions": {
            "can_invite_members": is_admin,
            "can_remove_members": is_admin,
            "can_change_roles": is_admin,
            "can_delete_team": is_owner,
            "can_manage_settings": is_admin
        }
    }