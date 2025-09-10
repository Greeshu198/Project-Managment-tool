import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../services/user_api";
import "./DashboardPage.css";

const features = [
  { title: "Task Management", description: "Organize tasks efficiently.", icon: "📝" },
  { title: "Team Collaboration", description: "Collaborate in real-time.", icon: "🤝" },
  { title: "Project Timeline", description: "Visualize your timelines.", icon: "📅" },
  { title: "Notifications", description: "Get timely updates.", icon: "🔔" },
];

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const projectName = "TaskMaster";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      // Check for token existence first
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return; // No token, so no user to fetch
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        // This likely means the token is invalid or expired
        localStorage.removeItem("token");
        setError("Your session has expired. Please sign in again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);
  
  const handleProfileClick = () => {
    navigate("/profile");
  };

  if (isLoading) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="logo">{projectName}</h1>
        <nav className="nav-buttons">
          {!user ? (
            <>
              <Link to="/signin" className="btn btn-secondary">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          ) : (
            <button onClick={handleProfileClick} className="btn btn-profile" title="View Profile">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          )}
        </nav>
      </header>
      
      <main className="main-content">
        <section className="hero">
          {user ? (
            <div className="profile-welcome">
              <h2>Welcome back, {user.full_name}!</h2>
              <p>Here's an overview of your projects. Let's get things done.</p>
            </div>
          ) : (
            <>
              <h2>Organize. Collaborate. Achieve.</h2>
              <p>TaskMaster helps your team stay productive and on track.</p>
              {error && <p className="error-message-dashboard">{error}</p>}
              <div className="hero-buttons">
                <Link to="/signup" className="btn btn-primary">Get Started</Link>
                <Link to="/signin" className="btn btn-secondary">Sign In</Link>
              </div>
            </>
          )}
        </section>

        <section className="features">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        &copy; {new Date().getFullYear()} {projectName}. All rights reserved.
      </footer>
    </div>
  );
};

export default DashboardPage;

