import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/Forgot-password/ForgotPassword";
import SignupPage from "./pages/Signup/SignupPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import FriendsPage from "./pages/Friends/FriendsPage";
import TeamsPage from "./pages/TeamsPage/TeamsPage";
// 1. Import your new and updated page components
import TeamDetailPage from "./pages/TeamDetailsPage/TeamDetailsPage"; 
import ProjectDetailPage from "./pages/ProjectDetailPage/ProjectDetailPage";

function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* --- Core & Auth Routes --- */}
      <Route path="/" element={ <DashboardPage /> } />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signin" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* --- Main Application Routes --- */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      
      {/* --- NEW: Dynamic Routes for Details Pages --- */}
      {/* This route will render the TeamDetailPage and pass the teamId from the URL */}
      <Route path="/teams/:teamId" element={<TeamDetailPage />} />
      
      {/* This route will render the ProjectDetailPage and pass the projectId from the URL */}
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
    </Routes>
  );
}

export default App;