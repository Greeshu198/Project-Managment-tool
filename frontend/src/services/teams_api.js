import axios from "axios";

// Create a dedicated API instance for teams
const API = axios.create({
  baseURL: "http://localhost:8000/teams",
});

// Use a request interceptor to automatically attach the JWT token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- Teams API Functions ---
export const createTeam = async (teamData) => {
  const res = await API.post("/", teamData);
  return res.data;
};

export const getUserTeams = async () => {
  const res = await API.get("/");
  return res.data;
};

export const getTeamDetails = async (teamId) => {
  const res = await API.get(`/${teamId}`);
  return res.data;
};

export const getPendingInvitations = async () => {
  const res = await API.get("/invitations/pending");
  return res.data;
};

export const respondToInvitation = async (teamId, accept) => {
  const res = await API.post(`/invitations/${teamId}/respond`, { accept });
  return res.data;
};

export const inviteUserToTeam = async (teamId, email, role) => {
  const res = await API.post(`/${teamId}/members`, { email, role });
  return res.data;
};

// --- NEW: Function to get current user's role and permissions in team ---
export const getMyRoleInTeam = async (teamId) => {
  const res = await API.get(`/${teamId}/my-role`);
  return res.data;
};

// --- Function to remove a member from a team (Admin only) ---
export const removeTeamMember = async (teamId, memberId) => {
  const res = await API.delete(`/${teamId}/members/${memberId}`);
  return res.status === 204; // Returns true on success
};

// --- Function to update a member's role (Admin only) ---
export const updateMemberRole = async (teamId, memberId, newRole) => {
  const res = await API.put(`/${teamId}/members/${memberId}/role`, { role: newRole });
  return res.data;
};

// --- Function to delete a team (Owner only) ---
export const deleteTeam = async (teamId) => {
  const res = await API.delete(`/${teamId}`);
  return res.status === 204; // Returns true on success
};

// --- User Search API Function (from friends endpoint) ---
const UserSearchAPI = axios.create({ 
  baseURL: "http://localhost:8000/friends" 
});

UserSearchAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const searchUsers = async (username) => {
  const res = await UserSearchAPI.get(`/search?username=${username}`);
  return res.data;
};