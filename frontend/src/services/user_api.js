import axios from "axios";

// Adjust this baseURL according to your FastAPI server
const API = axios.create({
  baseURL: "http://localhost:8000", // Change to deployed URL later
});

// --- USER APIs ---

// ✅ Check Username Availability
export const checkUsername = async (username) => {
  const res = await API.post("/users/check-username", { username });
  return res.data;
};

// ✅ Signup (creates inactive user & sends OTP)
export const signup = async (userData) => {
  const res = await API.post("users/signup", userData);
  return res.data;
};

// ✅ Verify OTP (activate user account)
export const verifyOtp = async (email, otp) => {
  const res = await API.post("/users/verify-otp", { email, otp });
  return res.data;
};

// ✅ Login (returns JWT token)
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  console.log("🔹 Sending login request with:", {
    username,
    password,
    body: formData.toString(),
  });

  const res = await API.post("/users/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  localStorage.setItem("token", res.data.access_token);
  return res.data;
};


// ✅ Forgot Password (sends OTP to email)
export const forgotPassword = async (email) => {
  const res = await API.post("/users/forgot-password", { email });
  return res.data;
};

// ✅ Reset Password (with OTP)
export const resetPassword = async (email, otp, newPassword) => {
  const res = await API.post("/users/reset-password", {
    email,
    otp,
    new_password: newPassword,
  });
  return res.data;
};

// ✅ Get Current User Info (requires JWT)
export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  const res = await API.get("users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Delete Current User (requires JWT)
export const deleteUser = async () => {
  const token = localStorage.getItem("token");
  const res = await API.delete("users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem("token"); // clear token on delete
  return res.status === 204;
};
