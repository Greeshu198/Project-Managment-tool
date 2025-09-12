# This file makes it easier to import all your SQLAlchemy models
# by importing them into the 'app.models' namespace.

from .user import User
from .team import Team, TeamMember, TeamRoleEnum, InvitationStatusEnum
from .project import Project, ProjectStatusEnum
from .task import Task, Comment, Attachment, TaskStatusEnum, TaskPriorityEnum
from .friendship import Friendship, FriendshipStatusEnum
from .milestone import Milestone, MilestoneStatusEnum # 1. Import new models

# You can optionally define __all__ to control what `from app.models import *` imports
__all__ = [
    "User",
    "Team", "TeamMember", "TeamRoleEnum", "InvitationStatusEnum",
    "Project", "ProjectStatusEnum",
    "Task", "Comment", "Attachment", "TaskStatusEnum", "TaskPriorityEnum",
    "Friendship", "FriendshipStatusEnum",
    "Milestone", "MilestoneStatusEnum", # 2. Add to __all__
]

