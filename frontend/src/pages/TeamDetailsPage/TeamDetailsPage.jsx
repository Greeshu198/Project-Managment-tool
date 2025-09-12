import { useState, useEffect } from "react";
import { 
  getTeamDetails, 
  inviteUserToTeam, 
  searchUsers, 
  removeTeamMember, 
  updateMemberRole, 
  deleteTeam,
  getMyRoleInTeam
} from "../../services/teams_api";
import { createProjectForTeam, getProjectsForTeam } from "../../services/project_api";
import "./TeamDetailsPage.css";

const TeamDetailPage = () => {
  const [team, setTeam] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteMethod, setInviteMethod] = useState("search");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [userPermissions, setUserPermissions] = useState({
    role: "member",
    is_owner: false,
    is_admin: false,
    permissions: {
      can_invite_members: false,
      can_remove_members: false,
      can_change_roles: false,
      can_delete_team: false,
      can_manage_settings: false
    }
  });
  
  // Project creation form state
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    due_date: "",
    status: "active"
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  // Get team ID from URL
  const teamId = window.location.pathname.split('/').pop();

  const fetchTeamData = async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const [teamData, roleData] = await Promise.all([
        getTeamDetails(teamId),
        getMyRoleInTeam(teamId)
      ]);
      
      setTeam(teamData);
      setUserPermissions(roleData);
      
      // Try to get projects, but don't fail if it doesn't work
      try {
        const projectsData = await getProjectsForTeam(teamId);
        setProjects(projectsData || []);
      } catch (projectError) {
        console.warn("Could not fetch projects:", projectError);
        // Use projects from team data if available, otherwise empty array
        setProjects(teamData?.projects || []);
      }
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError("Failed to load team details. The team may not exist or you may not have access.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const showTemporaryMessage = (msg, isError = false) => {
    setMessage(isError ? "" : msg);
    setError(isError ? msg : "");
    setTimeout(() => { setMessage(""); setError(""); }, 3000);
  };

  const refreshTeamData = async () => {
    try {
      const [updatedTeam, roleData] = await Promise.all([
        getTeamDetails(teamId),
        getMyRoleInTeam(teamId)
      ]);
      
      setTeam(updatedTeam);
      setUserPermissions(roleData);
      
      // Try to refresh projects
      try {
        const projectsData = await getProjectsForTeam(teamId);
        setProjects(projectsData || []);
      } catch (projectError) {
        console.warn("Could not refresh projects:", projectError);
        // Use projects from team data if available
        setProjects(updatedTeam?.projects || []);
      }
    } catch (err) {
      console.error("Failed to refresh team data:", err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      showTemporaryMessage("Failed to search for users.", true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteMemberBySearch = async (userToInvite) => {
    if (!userPermissions.permissions.can_invite_members) {
      showTemporaryMessage("You don't have permission to invite members.", true);
      return;
    }
    
    try {
      await inviteUserToTeam(teamId, userToInvite.email, selectedRole);
      showTemporaryMessage(`Invitation sent to ${userToInvite.username}.`);
      setSearchQuery("");
      setSearchResults([]);
      setShowInviteModal(false);
      await refreshTeamData();
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to send invitation.", true);
    }
  };

  const handleInviteMemberByEmail = async () => {
    if (!userPermissions.permissions.can_invite_members) {
      showTemporaryMessage("You don't have permission to invite members.", true);
      return;
    }
    
    if (!inviteEmail.trim()) {
      showTemporaryMessage("Please enter an email address.", true);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showTemporaryMessage("Please enter a valid email address.", true);
      return;
    }

    try {
      await inviteUserToTeam(teamId, inviteEmail, selectedRole);
      showTemporaryMessage(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail("");
      setShowInviteModal(false);
      await refreshTeamData();
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to send invitation.", true);
    }
  };

  const handleBackToTeams = () => {
    window.location.href = "/teams";
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!userPermissions.permissions.can_remove_members) {
      showTemporaryMessage("You don't have permission to remove members.", true);
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await removeTeamMember(teamId, memberId);
        showTemporaryMessage(`${memberName} has been removed from the team.`);
        await refreshTeamData();
      } catch (err) {
        showTemporaryMessage(err.response?.data?.detail || "Failed to remove member.", true);
      }
    }
  };

  const handlePromoteMember = async (memberId, memberName) => {
    if (!userPermissions.permissions.can_change_roles) {
      showTemporaryMessage("You don't have permission to change member roles.", true);
      return;
    }
    
    if (window.confirm(`Are you sure you want to promote ${memberName} to admin?`)) {
      try {
        await updateMemberRole(teamId, memberId, "admin");
        showTemporaryMessage(`${memberName} has been promoted to admin.`);
        await refreshTeamData();
      } catch (err) {
        showTemporaryMessage(err.response?.data?.detail || "Failed to promote member.", true);
      }
    }
  };

  const handleDemoteMember = async (memberId, memberName) => {
    if (!userPermissions.permissions.can_change_roles) {
      showTemporaryMessage("You don't have permission to change member roles.", true);
      return;
    }
    
    if (window.confirm(`Are you sure you want to demote ${memberName} to member?`)) {
      try {
        await updateMemberRole(teamId, memberId, "member");
        showTemporaryMessage(`${memberName} has been demoted to member.`);
        await refreshTeamData();
      } catch (err) {
        showTemporaryMessage(err.response?.data?.detail || "Failed to demote member.", true);
      }
    }
  };

  const handleCreateProject = () => {
    setShowCreateProjectModal(true);
  };

  const handleProjectFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectForm.name.trim()) {
      showTemporaryMessage("Please enter a project name.", true);
      return;
    }

    setIsCreatingProject(true);
    
    try {
      const projectData = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || null,
        due_date: projectForm.due_date || null,
        status: projectForm.status
      };
      
      await createProjectForTeam(teamId, projectData);
      showTemporaryMessage(`Project "${projectForm.name}" created successfully!`);
      setShowCreateProjectModal(false);
      resetProjectForm();
      await refreshTeamData();
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to create project.", true);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: "",
      description: "",
      due_date: "",
      status: "active"
    });
  };

  const handleViewProject = (projectId) => {
    window.location.href = `/projects/${projectId}`;
  };

  const handleDeleteTeam = async () => {
    if (!userPermissions.permissions.can_delete_team) {
      showTemporaryMessage("Only the team owner can delete the team.", true);
      return;
    }
    
    if (window.confirm("Are you absolutely sure you want to delete this team? This action cannot be undone and will delete all projects and data associated with this team.")) {
      try {
        await deleteTeam(teamId);
        showTemporaryMessage("Team deleted successfully.");
        setTimeout(() => {
          window.location.href = "/teams";
        }, 1500);
      } catch (err) {
        showTemporaryMessage(err.response?.data?.detail || "Failed to delete team.", true);
      }
    }
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteMethod("search");
    setSearchQuery("");
    setSearchResults([]);
    setInviteEmail("");
    setSelectedRole("member");
  };

  const resetCreateProjectModal = () => {
    setShowCreateProjectModal(false);
    resetProjectForm();
  };

  // Helper function to check if user can perform actions on a specific member
  const canActOnMember = (member) => {
    const isOwner = member.user.id === team.owner_id;
    const isSelf = member.user.id === userPermissions.user_id;
    return !isOwner && !isSelf;
  };

  // Check if user can create projects (manager or admin)
  const canCreateProjects = () => {
    return userPermissions.role === "admin" || userPermissions.role === "manager" || userPermissions.is_admin;
  };

  if (isLoading) {
    return (
      <div className="team-detail-page">
        <div className="team-detail-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Loading Team Details...</h1>
              <p>Please wait while we fetch the team information</p>
            </div>
          </div>
        </div>
        <div className="team-detail-container">
          <div className="loading-container">
            <div className="loading-skeleton"></div>
            <div className="loading-skeleton"></div>
            <div className="loading-skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="team-detail-page">
        <div className="team-detail-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Team Not Found</h1>
              <p>Unable to load team details</p>
            </div>
            <button onClick={handleBackToTeams} className="back-link">
              ← Back to Teams
            </button>
          </div>
        </div>
        <div className="team-detail-container">
          <div className="error-state">
            <div className="error-icon">⚠</div>
            <h3>Team Not Available</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={handleBackToTeams}>
              Return to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-detail-page">
      <div className="team-detail-header">
        <div className="header-content">
          <div className="header-left">
            <div className="team-header-info">
              <div className="team-avatar-large">
                {team?.name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div className="team-title-section">
                <h1>{team?.name || 'Team'}</h1>
                <p>{team?.description || "No description provided"}</p>
                <div className="team-stats">
                  <span className="stat-item">
                    <span className="stat-icon">👥</span>
                    {team?.members?.length || 0} members
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">📊</span>
                    {projects?.length || 0} projects
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleBackToTeams} className="back-link">
            ← Back to Teams
          </button>
        </div>
      </div>

      <div className="team-detail-container">
        {message && <div className="feedback-message success">{message}</div>}
        {error && <div className="feedback-message error">{error}</div>}

        <div className="team-detail-content">
          <div className="members-section">
            <div className="section-header">
              <h2>Team Members ({team?.members?.length || 0})</h2>
              {userPermissions.permissions.can_invite_members && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowInviteModal(true)}
                >
                  Invite Members
                </button>
              )}
            </div>
            
            {team?.members && team.members.length > 0 ? (
              <div className="members-grid">
                {team.members.map(member => (
                  <div key={member.user.id} className="member-card">
                    <div className="member-avatar">
                      {member.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{member.user.full_name}</span>
                      <span className="member-username">@{member.user.username}</span>
                      <span className="member-email">{member.user.email}</span>
                    </div>
                    <div className="member-role-section">
                      <span className={`member-role ${member.role}`}>{member.role}</span>
                    </div>
                    <div className="member-actions">
                      {canActOnMember(member) && userPermissions.permissions.can_change_roles && (
                        <>
                          {member.role === 'admin' ? (
                            <button 
                              className="btn btn-icon btn-warning" 
                              onClick={() => handleDemoteMember(member.user.id, member.user.full_name)}
                              title="Demote to Member"
                            >
                              ⬇️
                            </button>
                          ) : (
                            <button 
                              className="btn btn-icon btn-secondary" 
                              onClick={() => handlePromoteMember(member.user.id, member.user.full_name)}
                              title="Promote to Admin"
                            >
                              ⬆️
                            </button>
                          )}
                        </>
                      )}
                      {canActOnMember(member) && userPermissions.permissions.can_remove_members && (
                        <button 
                          className="btn btn-icon btn-danger" 
                          onClick={() => handleRemoveMember(member.user.id, member.user.full_name)}
                          title="Remove Member"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No members yet</h3>
                <p>Invite people to join this team and start collaborating</p>
                {userPermissions.permissions.can_invite_members && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowInviteModal(true)}
                  >
                    Invite First Member
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="projects-section">
            <div className="section-header">
              <h2>Projects ({projects?.length || 0})</h2>
              {canCreateProjects() && (
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateProject}
                >
                  Create Project
                </button>
              )}
            </div>
            
            {projects && projects.length > 0 ? (
              <div className="projects-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card">
                    <div className="project-header">
                      <h3>{project.name}</h3>
                      <span className={`project-status ${project.status}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="project-description">
                      {project.description || "No description provided"}
                    </p>
                    <div className="project-stats">
                      <span className="project-stat">
                        📝 {project.milestones?.length || 0} milestones
                      </span>
                      <span className="project-stat">
                        ✅ {project.tasks?.length || 0} tasks
                      </span>
                      {project.due_date && (
                        <span className="project-stat">
                          📅 Due: {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="project-actions">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleViewProject(project.id)}
                      >
                        View Project
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No projects yet</h3>
                <p>Create your first project to start organizing work for this team</p>
                {canCreateProjects() && (
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreateProject}
                  >
                    Create First Project
                  </button>
                )}
              </div>
            )}
          </div>

          {userPermissions.permissions.can_manage_settings && (
            <div className="team-settings-section">
              <div className="section-header">
                <h2>Team Settings</h2>
              </div>
              
              <div className="settings-grid">
                <div className="setting-card">
                  <div className="setting-info">
                    <h3>Team Visibility</h3>
                    <p>Control who can see and join this team</p>
                  </div>
                  <button className="btn btn-secondary">
                    Manage
                  </button>
                </div>
                
                <div className="setting-card">
                  <div className="setting-info">
                    <h3>Permissions</h3>
                    <p>Set role-based permissions for team members</p>
                  </div>
                  <button className="btn btn-secondary">
                    Configure
                  </button>
                </div>
                
                {userPermissions.permissions.can_delete_team && (
                  <div className="setting-card danger">
                    <div className="setting-info">
                      <h3>Delete Team</h3>
                      <p>Permanently delete this team and all its data</p>
                    </div>
                    <button 
                      className="btn btn-danger"
                      onClick={handleDeleteTeam}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={resetInviteModal}>
          <div className="modal-content invite-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Members to {team?.name}</h2>
              <button className="modal-close" onClick={resetInviteModal}>×</button>
            </div>
            <div className="modal-body">
              {/* Invite Method Toggle */}
              <div className="invite-method-toggle">
                <button 
                  className={`method-btn ${inviteMethod === 'search' ? 'active' : ''}`}
                  onClick={() => setInviteMethod('search')}
                >
                  Search Users
                </button>
                <button 
                  className={`method-btn ${inviteMethod === 'email' ? 'active' : ''}`}
                  onClick={() => setInviteMethod('email')}
                >
                  Invite by Email
                </button>
              </div>

              {/* Role Selection */}
              <div className="role-selection">
                <label>Role:</label>
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="role-select"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteMethod === 'search' ? (
                <>
                  <div className="search-container">
                    <div className="search-bar">
                      <input 
                        type="text" 
                        placeholder="Search by username..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                      />
                    </div>
                  </div>
                  {isSearching ? (
                    <div className="loading-container">
                      <div className="loading-skeleton"></div>
                    </div>
                  ) : (
                    <div className="search-results">
                      {searchResults.length > 0 ? (
                        <div className="users-list">
                          {searchResults.map(user => (
                            <div key={user.id} className="user-result-card">
                              <div className="user-avatar">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="user-info">
                                <span className="user-name">{user.full_name}</span>
                                <span className="user-username">@{user.username}</span>
                              </div>
                              <button 
                                className="btn btn-primary btn-small" 
                                onClick={() => handleInviteMemberBySearch(user)}
                              >
                                Invite as {selectedRole}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        searchQuery.length >= 2 && (
                          <div className="empty-search">
                            <p>No users found matching "{searchQuery}"</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="email-invite-section">
                  <div className="form-group">
                    <label>Email Address:</label>
                    <input 
                      type="email" 
                      placeholder="Enter email address..." 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="email-input"
                    />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleInviteMemberByEmail}
                    disabled={!inviteEmail.trim()}
                  >
                    Send Invitation as {selectedRole}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="modal-backdrop" onClick={resetCreateProjectModal}>
          <div className="modal-content create-project-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="modal-close" onClick={resetCreateProjectModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleProjectFormSubmit} className="project-form">
                <div className="form-group">
                  <label htmlFor="project-name">Project Name *</label>
                  <input
                    id="project-name"
                    type="text"
                    placeholder="Enter project name..."
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="project-description">Description</label>
                  <textarea
                    id="project-description"
                    placeholder="Enter project description..."
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="project-due-date">Due Date</label>
                    <input
                      id="project-due-date"
                      type="date"
                      value={projectForm.due_date}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="project-status">Status</label>
                    <select
                      id="project-status"
                      value={projectForm.status}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                      className="form-select"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetCreateProjectModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isCreatingProject || !projectForm.name.trim()}
                  >
                    {isCreatingProject ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;