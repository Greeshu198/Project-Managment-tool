import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup, verifyOtp, checkUsername } from "../../services/user_api";
import "./SignupPage.css";

function SignupPage() {
  // Core states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("signup"); // 'signup' or 'verify-otp'

  // UI/Feedback states
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Advanced validation states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({
    available: null, // null, true, or false
    message: "",
    suggestions: [],
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const navigate = useNavigate();

  // Debounced effect for checking username availability
  useEffect(() => {
    if (username.length <= 2) {
      setUsernameStatus({ available: null, message: "", suggestions: [] });
      return;
    }
    const handler = setTimeout(() => handleUsernameCheck(username), 500);
    return () => clearTimeout(handler);
  }, [username]);

  // Effect for checking password strength
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const handleUsernameCheck = async (currentUsername) => {
    setIsCheckingUsername(true);
    setUsernameStatus({ available: null, message: "", suggestions: [] });
    try {
      const res = await checkUsername(currentUsername);
      // --- CORRECTION: Match the backend response key "is_available" ---
      setUsernameStatus({ available: res.is_available, message: res.message, suggestions: res.suggestions || [] });
    } catch (err) {
      setUsernameStatus({ available: false, message: err.response?.data?.message || "Error checking username", suggestions: err.response?.data?.suggestions || [] });
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // --- Perform granular validation on submit for clear feedback ---
    const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

    if (usernameStatus.available !== true) {
      setError("Please choose an available username.");
      setHasError(true);
      setTimeout(() => { setHasError(false); setError(""); }, 3000);
      return;
    }
    if (!isPasswordStrong) {
      setError("Please ensure your password meets all strength requirements.");
      setHasError(true);
      setTimeout(() => { setHasError(false); setError(""); }, 3000);
      return;
    }
    if (email.trim().length === 0 || fullName.trim().length === 0) {
      setError("Please fill out your email and full name.");
      setHasError(true);
      setTimeout(() => { setHasError(false); setError(""); }, 3000);
      return;
    }
    // --- END CORRECTION ---

    setIsLoading(true);
    setError("");
    setMessage("");
    setHasError(false);

    try {
      await signup({ username, email, full_name: fullName, password });
      setMessage("Account created! Please check your email for the verification OTP.");
      setStage("verify-otp");
    } catch (err) {
      setHasError(true);
      setError(err.response?.data?.message || "Failed to create account.");
      setTimeout(() => setHasError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    setHasError(false);

    try {
      await verifyOtp(email, otp);
      setMessage("Account verified successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setHasError(true);
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      setTimeout(() => setHasError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameInputClass = () => {
    if (username.length <= 2) return "";
    if (isCheckingUsername) return "";
    if (usernameStatus.available === true) {
      return "input-success";
    }
    if (usernameStatus.available === false) {
      return "input-error";
    }
    return "";
  };

  return (
    <div className="signup-container">
      <form
        onSubmit={stage === "signup" ? handleSignupSubmit : handleVerifySubmit}
        className={`signup-form ${hasError ? 'error' : ''}`}
      >
        <h2>{stage === 'signup' ? 'Create Account' : 'Verify Email'}</h2>

        {error && <div className="error-message">⚠️ {error}</div>}
        {message && <div className="success-message">✅ {message}</div>}

        {stage === "signup" ? (
          <>
            <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={getUsernameInputClass()}
                required
                disabled={isLoading}
              />
              {isCheckingUsername && <div className="loader"></div>}
            </div>
            
            {!isCheckingUsername && usernameStatus.message && (
              <div className={`username-status ${usernameStatus.available ? 'success' : 'error'}`}>
                {usernameStatus.message}
              </div>
            )}
            {!isCheckingUsername && usernameStatus.suggestions.length > 0 && (
              <div className="username-suggestions">
                <span>Suggestions:</span>
                {usernameStatus.suggestions.slice(0, 3).map((s) => (
                  <button key={s} type="button" className="suggestion-btn" onClick={() => setUsername(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
            
            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {password.length > 0 && (
              <div className="password-strength-meter">
                <div className={`strength-criterion ${passwordStrength.length ? 'valid' : 'invalid'}`}>
                  {passwordStrength.length ? '✓' : '✗'} 8+ Characters
                </div>
                <div className={`strength-criterion ${passwordStrength.lowercase ? 'valid' : 'invalid'}`}>
                  {passwordStrength.lowercase ? '✓' : '✗'} 1 Lowercase
                </div>
                <div className={`strength-criterion ${passwordStrength.uppercase ? 'valid' : 'invalid'}`}>
                  {passwordStrength.uppercase ? '✓' : '✗'} 1 Uppercase
                </div>
                <div className={`strength-criterion ${passwordStrength.number ? 'valid' : 'invalid'}`}>
                  {passwordStrength.number ? '✓' : '✗'} 1 Number
                </div>
                <div className={`strength-criterion ${passwordStrength.special ? 'valid' : 'invalid'}`}>
                  {passwordStrength.special ? '✓' : '✗'} 1 Special
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Sign Up"}
            </button>
          </>
        ) : (
          <>
            <p>Enter the 6-digit OTP sent to <strong>{email}</strong> to activate your account.</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Account"}
            </button>
          </>
        )}

        <div className="login-link-container">
          <p className="login-text">Already have an account?</p>
          <Link to="/login" className="login-link">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
