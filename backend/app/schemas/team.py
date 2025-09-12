from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from app.models.team import TeamRoleEnum, InvitationStatusEnum

# --- User Info for nested responses ---
class UserBase(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)

# --- Base and Create Schemas ---
class TeamMemberBase(BaseModel):
    role: TeamRoleEnum = TeamRoleEnum.member

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TeamInvite(BaseModel):
    email: EmailStr
    role: TeamRoleEnum = TeamRoleEnum.member

# --- Update Schemas ---
class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    role: TeamRoleEnum

class InvitationResponse(BaseModel):
    accept: bool

# --- Full Response Schemas ---
class TeamMember(TeamMemberBase):
    id: int
    user: UserBase
    status: InvitationStatusEnum
    model_config = ConfigDict(from_attributes=True)

class Team(TeamCreate):
    id: int
    owner_id: int
    members: List[TeamMember] = []
    model_config = ConfigDict(from_attributes=True)

# --- Other Schemas ---
class TeamInvitation(BaseModel):
    team: Team
    role: TeamRoleEnum
    model_config = ConfigDict(from_attributes=True)

class InvitationConfirmation(BaseModel):
    message: str

# --- NEW: Permissions Schema (This is the fix) ---
class TeamPermissions(BaseModel):
    can_invite_members: bool
    can_remove_members: bool
    can_change_roles: bool
    can_delete_team: bool
    can_manage_settings: bool

class TeamMemberPermissions(BaseModel):
    user_id: int
    role: TeamRoleEnum
    is_owner: bool
    is_admin: bool
    permissions: TeamPermissions