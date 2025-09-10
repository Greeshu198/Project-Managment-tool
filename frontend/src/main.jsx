import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.jsx";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/Forgot-password/ForgotPassword"; 
import SignupPage from "./pages/Signup/SignupPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<LoginPage />} />  
          <Route path="/forgot-password" element={<ForgotPasswordPage />} /> 
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
