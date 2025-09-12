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
  const navigate = useNavigate();
  const projectName = "TaskMaster";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null); // Ensure user is null if token is invalid
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

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
            <>
              {/* --- 1. ADDED FRIENDS LINK --- */}
              <Link to="/friends" className="btn btn-profile" title="Connections">
                {/* Connections Icon (Users) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </Link>
              <Link to="/profile" className="btn btn-profile" title="My Profile">
                {/* Profile Icon (User) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        <section className="hero">
          {user ? (
             <div className="profile-welcome">
                <h2>Welcome back, {user.full_name || user.username}!</h2>
                <p>Ready to tackle your tasks for the day?</p>
             </div>
          ) : (
            <>
              <h2>Organize. Collaborate. Achieve.</h2>
              <p>TaskMaster helps your team stay productive and on track.</p>
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