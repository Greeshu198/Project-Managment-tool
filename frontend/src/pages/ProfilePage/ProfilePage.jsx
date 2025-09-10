import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, deleteUser } from "../../services/user_api";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login"); // Redirect if token is invalid
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDelete = async () => {
    // A real app should use a modal for confirmation.
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await deleteUser();
        handleLogout(); // Logout after successful deletion
      } catch (err) {
        setError("Failed to delete account. Please try again later.");
      }
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading Profile...</div>;
  }

  if (!user) {
    // This state can be reached if the fetch fails and redirects.
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Account Details</h2>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Full Name</span>
            <span className="detail-value">{user.full_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Username</span>
            <span className="detail-value">{user.username}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{user.email}</span>
          </div>
        </div>

        {error && <div className="error-message-profile">⚠️ {error}</div>}

        <div className="profile-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary">Back to Dashboard</button>
          <button onClick={handleLogout} className="btn btn-primary">Logout</button>
          <button onClick={handleDelete} className="btn btn-danger">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
