import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/Forgot-password/ForgotPassword";
import SignupPage from "./pages/Signup/SignupPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage"; // 1. Import the ProfilePage

function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="rounded-2xl bg-white p-10 shadow-xl text-center">
              <h1 className="text-4xl font-bold text-purple-600 mb-4">
                🚀 Welcome to TaskNest
              </h1>
              <p className="text-gray-700">
                Your project is running with{" "}
                <span className="font-semibold">Vite + React + TailwindCSS</span>.
              </p>

              <div className="mt-6 flex gap-4 justify-center">
                <button
                  className="rounded-lg bg-purple-500 px-6 py-2 text-white font-medium 
                             hover:bg-purple-600 transition-colors"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </button>

                <button
                  className="rounded-lg bg-teal-500 px-6 py-2 text-white font-medium 
                             hover:bg-teal-600 transition-colors"
                  onClick={() => navigate("/signin")}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        }
      />

      {/* App Routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signin" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/profile" element={<ProfilePage />} /> {/* 2. Add the profile route */}
    </Routes>
  );
}

export default App;
