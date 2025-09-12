import { useState, useEffect } from "react";
import {
  getUserTeams,
  getPendingInvitations,
  respondToInvitation,
  createTeam,
  searchUsers,
  inviteUserToTeam,
} from "../../services/teams_api";
import "./TeamsPage.css";

const TeamsPage = () => {
  const [activeTab, setActiveTab] = useState("my-teams");
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(null);
  
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const teamsData = await getUserTeams();
      const invitesData = await getPendingInvitations();
      setTeams(teamsData);
      setInvitations(invitesData);
    } catch (err) {
      setError("Failed to load team data. Your session may have expired.");
    } finally {
      setIsLoading(false);
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

  const handleInvite = async (userToInvite) => {
    if (!showInviteModal) return;
    try {
      await inviteUserToTeam(showInviteModal.id, userToInvite.email, 'member');
      showTemporaryMessage(`Invitation sent to ${userToInvite.username}.`);
      setSearchQuery("");
      setSearchResults([]);
      setShowInviteModal(null);
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to send invitation.", true);
    }
  };

  const handleRespond = async (teamId, accept) => {
    try {
      await respondToInvitation(teamId, accept);
      showTemporaryMessage(accept ? "Invitation accepted!" : "Invitation declined.");
      fetchData();
    } catch (err) {
      showTemporaryMessage("Failed to respond to invitation.", true);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      showTemporaryMessage("Team name cannot be empty.", true);
      return;
    }
    try {
      await createTeam({ name: newTeamName, description: newTeamDesc });
      showTemporaryMessage(`Team '${newTeamName}' created successfully!`);
      setShowCreateModal(false);
      setNewTeamName(""); 
      setNewTeamDesc("");
      fetchData();
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to create team.", true);
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Team Management</h1>
            <p>Create teams, manage members, and collaborate on projects</p>
          </div>
          <button onClick={handleBackToDashboard} className="back-link">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="teams-container">
        <div className="tabs-section">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'my-teams' ? 'active' : ''}`} 
              onClick={() => setActiveTab('my-teams')}
            >
              <span className="tab-icon">👥</span>
              My Teams
              <span className="tab-count">{teams.length}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'invitations' ? 'active' : ''}`} 
              onClick={() => setActiveTab('invitations')}
            >
              <span className="tab-icon">📨</span>
              Invitations
              {invitations.length > 0 && (
                <span className="notification-badge">{invitations.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className="content-area">
          {message && <div className="feedback-message success">{message}</div>}
          {error && <div className="feedback-message error">{error}</div>}

          <div className="tab-content">
            {activeTab === 'my-teams' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Your Teams ({teams.length})</h2>
                  <button className="btn btn-primary create-team-btn" onClick={() => setShowCreateModal(true)}>
                    + Create New Team
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-skeleton"></div>
                    <div className="loading-skeleton"></div>
                    <div className="loading-skeleton"></div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No teams yet</h3>
                    <p>Create your first team to start collaborating on projects</p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                      Create Team
                    </button>
                  </div>
                ) : (
                  <div className="teams-grid">
                    {teams.map(team => (
                      <div key={team.id} className="team-card">
                        <div className="team-avatar">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="team-info">
                          <span className="team-name">{team.name}</span>
                          <span className="team-desc">{team.description || "No description provided"}</span>
                          <span className="team-stats">{team.member_count || 1} members</span>
                        </div>
                        <div className="team-actions">
                          <button 
                            className="btn btn-icon btn-primary" 
                            onClick={() => setShowInviteModal(team)}
                            title="Invite Members"
                          >
                            👤➕
                          </button>
                          <button 
                            className="btn btn-icon btn-secondary" 
                            onClick={() => window.location.href = `/teams/${team.id}`}
                            title="View Team"
                          >
                            👁️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Pending Invitations ({invitations.length})</h2>
                </div>
                
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-skeleton"></div>
                    <div className="loading-skeleton"></div>
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📨</div>
                    <h3>No pending invitations</h3>
                    <p>You'll see team invitations here when people invite you to join their teams</p>
                  </div>
                ) : (
                  <div className="invitations-list">
                    {invitations.map(invite => (
                      <div key={invite.team.id} className="invitation-card">
                        <div className="invitation-avatar">
                          {invite.team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="invitation-info">
                          <span className="invitation-title">Invitation to join <strong>{invite.team.name}</strong></span>
                          <span className="invitation-role">You have been invited as a {invite.role}</span>
                          <span className="invitation-desc">{invite.team.description || "No description provided"}</span>
                        </div>
                        <div className="invitation-actions">
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleRespond(invite.team.id, true)}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleRespond(invite.team.id, false)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create a New Team</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTeam} className="modal-form">
              <div className="form-group">
                <label>Team Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter team name" 
                  value={newTeamName} 
                  onChange={(e) => setNewTeamName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  placeholder="Describe what this team will work on (optional)" 
                  value={newTeamDesc} 
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(null)}>
          <div className="modal-content invite-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Members to {showInviteModal.name}</h2>
              <button className="modal-close" onClick={() => setShowInviteModal(null)}>×</button>
            </div>
            <div className="modal-body">
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
                            onClick={() => handleInvite(user)}
                          >
                            Invite
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;