import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../services/user_api";
import "./ForgotPassword.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [stage, setStage] = useState("enter-email"); // 'enter-email' or 'enter-otp'
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    setHasError(false);

    try {
      await forgotPassword(email);
      setMessage("An OTP has been sent to your email address.");
      setStage("enter-otp"); // Move to the next stage
    } catch (err) {
      setHasError(true);
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
      setTimeout(() => setHasError(false), 500); // Reset animation class
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    setHasError(false);

    try {
      await resetPassword(email, otp, newPassword);
      setMessage("Password has been reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setHasError(true);
      setError(err.response?.data?.message || "Invalid OTP or failed to reset password.");
      setTimeout(() => setHasError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <form
        onSubmit={stage === "enter-email" ? handleEmailSubmit : handleResetSubmit}
        className={`fp-form ${hasError ? 'error' : ''}`}
      >
        <h2>Reset Password</h2>
        
        {error && <div className="error-message">⚠️ {error}</div>}
        {message && <div className="success-message">✅ {message}</div>}

        {stage === "enter-email" ? (
          <>
            <p>Enter your email address and we'll send you an OTP to reset your password.</p>
            <input
              type="email"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <p>Enter the OTP from your email and your new password.</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        <div className="back-to-login">
          <Link to="/login" className="back-link">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
