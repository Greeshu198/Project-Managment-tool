# This file makes it easy to import all your Pydantic schemas from one place.

# ... (existing user, team, and friendship imports) ...
from .user import ( User, UserCreate, Token, TokenData, UsernameCheckRequest,
    UsernameCheckResponse, OTPVerify, PasswordResetRequest, PasswordResetConfirm )
from .team import ( TeamMemberBase, TeamMember, TeamMemberUpdate, Team, TeamCreate, TeamUpdate,
    TeamInvite, InvitationResponse, TeamInvitation, InvitationConfirmation, TeamMemberPermissions )
from .friendship import ( FriendRequestCreate, FriendRequestResponse, Friendship, PendingFriendRequest )
from .project import ( Project, ProjectCreate, ProjectUpdate )

# --- NEW: Import schemas from your milestone schema file ---
from .milestone import (
    Milestone,
    MilestoneCreate,
    MilestoneUpdate
)

# You can optionally define __all__ to control what `from app.schemas import *` imports
__all__ = [
    # ... (existing schemas) ...
    "User", "UserCreate", "Token", "TokenData", "UsernameCheckRequest",
    "UsernameCheckResponse", "OTPVerify", "PasswordResetRequest", "PasswordResetConfirm",
    "TeamMemberBase", "TeamMember", "TeamMemberUpdate", "Team", "TeamCreate", "TeamUpdate",
    "TeamInvite", "InvitationResponse", "TeamInvitation", "InvitationConfirmation", "TeamMemberPermissions",
    "FriendRequestCreate", "FriendRequestResponse", "Friendship", "PendingFriendRequest",
    "Project", "ProjectCreate", "ProjectUpdate",
    
    # --- NEW: Add milestone schemas to __all__ ---
    "Milestone", "MilestoneCreate", "MilestoneUpdate"
]

