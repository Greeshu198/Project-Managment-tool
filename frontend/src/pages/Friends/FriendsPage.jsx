import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  respondToRequest,
  getFriendsList,
  removeFriend
} from "../../services/friend_api";
import "./FriendsPage.css";

// A simple debounce utility to prevent spamming the API while typing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState("my-friends");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const navigate = useNavigate();

  // Fetch initial data on component mount
  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  // Effect for handling debounced user search
  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  const showTemporaryMessage = (msg, isError = false) => {
    setMessage(isError ? "" : msg);
    setError(isError ? msg : "");
    setTimeout(() => {
        setMessage("");
        setError("");
    }, 3000);
  };

  const fetchFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const data = await getFriendsList();
      setFriends(data);
    } catch (err) {
      setError("Failed to fetch friends list.");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const data = await getPendingRequests();
      setPendingRequests(data);
    } catch (err) {
      setError("Failed to fetch pending requests.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const data = await searchUsers(debouncedSearchTerm);
      setSearchResults(data);
    } catch (err) {
      showTemporaryMessage("Failed to perform search.", true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (username) => {
    try {
      await sendFriendRequest(username);
      showTemporaryMessage(`Friend request sent to ${username}.`);
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to send request.", true);
    }
  };

  const handleRespond = async (requestId, accept) => {
    try {
      await respondToRequest(requestId, accept);
      showTemporaryMessage(accept ? "Friend request accepted!" : "Friend request declined.");
      // Refresh both lists after responding
      fetchFriends();
      fetchPendingRequests();
    } catch (err) {
      showTemporaryMessage("Failed to respond to request.", true);
    }
  };

  const handleRemoveFriend = async (friendId, username) => {
    if (window.confirm(`Are you sure you want to remove ${username} from your friends?`)) {
      try {
        await removeFriend(friendId);
        showTemporaryMessage(`Removed ${username} from friends.`);
        fetchFriends(); // Refresh the friends list
      } catch (err) {
        showTemporaryMessage(err.response?.data?.detail || "Failed to remove friend.", true);
      }
    }
  };
  
  const handleSendMessage = (username) => {
    showTemporaryMessage(`Messaging feature for ${username} is coming soon!`);
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Connections</h1>
            <p>Manage your network and discover new connections</p>
          </div>
          <button onClick={() => navigate("/dashboard")} className="back-link">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="friends-container">
        <div className="tabs-section">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'my-friends' ? 'active' : ''}`} 
              onClick={() => setActiveTab('my-friends')}
            >
              <span className="tab-icon">👥</span>
              My Friends
              <span className="tab-count">{friends.length}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} 
              onClick={() => setActiveTab('pending')}
            >
              <span className="tab-icon">⏳</span>
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="notification-badge">{pendingRequests.length}</span>
              )}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'find' ? 'active' : ''}`} 
              onClick={() => setActiveTab('find')}
            >
              <span className="tab-icon">🔍</span>
              Find People
            </button>
          </div>
        </div>

        <div className="content-area">
          {message && <div className="feedback-message success">{message}</div>}
          {error && <div className="feedback-message error">{error}</div>}

          <div className="tab-content">
            {activeTab === 'my-friends' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Your Friends ({friends.length})</h2>
                </div>
                {isLoadingFriends ? (
                  <div className="loading-container">
                    <div className="loading-skeleton"></div>
                    <div className="loading-skeleton"></div>
                    <div className="loading-skeleton"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No friends yet</h3>
                    <p>Start connecting with people using the 'Find People' tab</p>
                    <button className="btn btn-primary" onClick={() => setActiveTab('find')}>
                      Find People
                    </button>
                  </div>
                ) : (
                  <div className="friends-grid">
                    {friends.map(friend => (
                      <div key={friend.id} className="friend-card">
                        <div className="friend-avatar">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="friend-info">
                          <span className="friend-username">{friend.username}</span>
                          <span className="friend-fullname">{friend.full_name}</span>
                        </div>
                        <div className="friend-actions">
                          <button 
                            className="btn btn-icon btn-primary" 
                            onClick={() => handleSendMessage(friend.username)}
                            title="Send Message"
                          >
                            💬
                          </button>
                          <button 
                            className="btn btn-icon btn-secondary" 
                            onClick={() => handleRemoveFriend(friend.id, friend.username)}
                            title="Remove Friend"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>Pending Requests ({pendingRequests.length})</h2>
                </div>
                {isLoadingRequests ? (
                  <div className="loading-container">
                    <div className="loading-skeleton"></div>
                    <div className="loading-skeleton"></div>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⏳</div>
                    <h3>No pending requests</h3>
                    <p>You'll see friend requests here when people want to connect with you</p>
                  </div>
                ) : (
                  <div className="requests-list">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="request-card">
                        <div className="request-avatar">
                          {req.requester.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="request-info">
                          <span className="request-username">{req.requester.username}</span>
                          <span className="request-message">wants to connect with you</span>
                        </div>
                        <div className="request-actions">
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleRespond(req.id, true)}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleRespond(req.id, false)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'find' && (
              <div className="content-section">
                <div className="search-container">
                  <div className="search-bar">
                    <input
                      type="text"
                      placeholder="Search by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {isSearching ? (
                  <div className="loading-container">
                    <div className="loading-skeleton"></div>
                  </div>
                ) : (
                  <div className="search-results">
                    {searchResults.length > 0 ? (
                      <div className="users-grid">
                        {searchResults.map(user => (
                          <div key={user.id} className="user-card">
                            <div className="user-avatar">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                              <span className="user-username">{user.username}</span>
                              <span className="user-fullname">{user.full_name}</span>
                            </div>
                            <div className="user-actions">
                              <button 
                                className="btn btn-primary" 
                                onClick={() => handleSendRequest(user.username)}
                              >
                                Send Request
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      debouncedSearchTerm.length >= 2 && (
                        <div className="empty-state">
                          <div className="empty-icon">🔍</div>
                          <h3>No users found</h3>
                          <p>Try searching with a different username</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;

