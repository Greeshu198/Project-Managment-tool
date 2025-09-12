import axios from "axios";

// Create a dedicated API instance for all friend-related endpoints.
const API = axios.create({
  baseURL: "http://localhost:8000/friends",
});

// Use a request interceptor to automatically attach the JWT token
// to every request, which is essential for authentication.
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Use a response interceptor for centralized error handling.
// This will automatically redirect to the login page on session expiry.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// --- Friends API Functions ---

/**
 * Searches for users by their username.
 * @param {string} username - The search query.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const searchUsers = async (username) => {
  const res = await API.get(`/search?username=${username}`);
  return res.data;
};

/**
 * Sends a friend request to another user.
 * @param {string} username - The username of the user to send the request to.
 * @returns {Promise<Object>} The new friendship object.
 */
export const sendFriendRequest = async (username) => {
  const res = await API.post("/request", { addressee_username: username });
  return res.data;
};

/**
 * Fetches all pending friend requests for the current user.
 * @returns {Promise<Array>} An array of pending request objects.
 */
export const getPendingRequests = async () => {
  const res = await API.get("/requests/pending");
  return res.data;
};

/**
 * Responds to a pending friend request.
 * @param {number} friendshipId - The ID of the friendship request.
 * @param {boolean} accept - True to accept, false to decline.
 */
export const respondToRequest = async (friendshipId, accept) => {
  const res = await API.post(`/requests/${friendshipId}/respond`, { accept });
  return res.data;
};

/**
 * Fetches the list of all accepted friends for the current user.
 * @returns {Promise<Array>} An array of user objects who are friends.
 */
export const getFriendsList = async () => {
  const res = await API.get("/");
  return res.data;
};

/**
 * Removes a friend from the user's friend list.
 * @param {number} friendId - The ID of the user to remove.
 * @returns {Promise<boolean>} True if successful.
 */
export const removeFriend = async (friendId) => {
  const res = await API.delete(`/${friendId}`);
  return res.status === 204;
};
