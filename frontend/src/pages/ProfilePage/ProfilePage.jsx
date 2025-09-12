import { useState, useEffect } from "react";
import { getCurrentUser, deleteUser } from "../../services/user_api";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError("Your session may have expired. Please sign in again.");
        localStorage.removeItem("token");
        setTimeout(() => window.location.href = "/login", 2000);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const showTemporaryMessage = (msg, isError = false) => {
    setMessage(isError ? "" : msg);
    setError(isError ? msg : "");
    setTimeout(() => { setMessage(""); setError(""); }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    showTemporaryMessage("Logging out...");
    setTimeout(() => window.location.href = "/login", 1000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      try {
        await deleteUser();
        showTemporaryMessage("Account deleted successfully.");
        setTimeout(() => window.location.href = "/signup", 2000);
      } catch (err) {
        showTemporaryMessage("Failed to delete account. Please try again.", true);
      }
    }
  };
  
  const handleManageConnections = () => {
    window.location.href = "/friends";
  };

  const handleManageTeams = () => {
    window.location.href = "/teams";
  };

  const handleBackToDashboard = () => {
    window.location.href = "/dashboard";
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <div className="header-content">
            <div className="header-left">
              <h1>My Profile</h1>
              <p>Loading your profile information...</p>
            </div>
          </div>
        </div>
        <div className="profile-container">
          <div className="loading-container">
            <div className="loading-skeleton"></div>
            <div className="loading-skeleton"></div>
            <div className="loading-skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-content">
          <div className="header-left">
            <h1>My Profile</h1>
            <p>Manage your account settings and team connections</p>
          </div>
          <button onClick={handleBackToDashboard} className="back-link">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="profile-container">
        {message && <div className="feedback-message success">{message}</div>}
        {error && <div className="feedback-message error">{error}</div>}

        {user ? (
          <div className="profile-content">
            <div className="profile-info-section">
              <div className="section-header">
                <h2>Account Information</h2>
              </div>
              <div className="profile-details">
                <div className="detail-card">
                  <div className="detail-icon">👤</div>
                  <div className="detail-content">
                    <span className="detail-label">Username</span>
                    <span className="detail-value">{user.username}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">📝</div>
                  <div className="detail-content">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{user.full_name}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">📧</div>
                  <div className="detail-content">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{user.email}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">🏷️</div>
                  <div className="detail-content">
                    <span className="detail-label">Role</span>
                    <span className="detail-value">{user.role || 'Member'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-actions-section">
              <div className="section-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="actions-grid">
                <button className="action-card btn-primary" onClick={handleManageTeams}>
                  <div className="action-icon">👥</div>
                  <div className="action-content">
                    <span className="action-title">Manage Teams</span>
                    <span className="action-desc">Create and manage your project teams</span>
                  </div>
                </button>
                <button className="action-card btn-secondary" onClick={handleManageConnections}>
                  <div className="action-icon">🤝</div>
                  <div className="action-content">
                    <span className="action-title">Connections</span>
                    <span className="action-desc">Manage your professional network</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="profile-settings-section">
              <div className="section-header">
                <h2>Account Settings</h2>
              </div>
              <div className="settings-actions">
                <button className="btn btn-secondary" onClick={handleLogout}>
                  <span className="btn-icon">🚪</span>
                  Logout
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  <span className="btn-icon">⚠️</span>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h3>Profile Not Found</h3>
            <p>{error || "Could not load user profile."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;