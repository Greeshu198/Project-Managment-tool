import { useState } from "react";
import { login } from "../../services/user_api";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setHasError(false);
    
    console.log("🔹 User submitting login form:", { username, password });

    try {
      const res = await login(username, password);
      console.log("✅ Login success:", res);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      
      // Trigger error animation and display error message
      setHasError(true);
      setError(err.response?.data?.message || "Invalid username or password");
      
      // Remove error state after animation completes
      setTimeout(() => {
        setHasError(false);
      }, 500);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="login-container">
      <form 
        onSubmit={handleLogin} 
        className={`login-form ${hasError ? 'error' : ''}`}
      >
        <h2>Login</h2>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <a 
          href="#" 
          className="forgot-password"
          onClick={(e) => {
            e.preventDefault();
            handleForgotPassword();
          }}
        >
          Forgot your password?
        </a>
        
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
        
        <div className="signup-link">
          <p className="signup-text">Are you a new customer?</p>
          <a 
            href="#" 
            className="signup-button"
            onClick={(e) => {
              e.preventDefault();
              handleSignUp();
            }}
          >
            Create Account
          </a>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;