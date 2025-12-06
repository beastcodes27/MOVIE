import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './UserManagement.css';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get users from Firestore users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', userId));
      setSuccess('User deleted successfully!');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.uid?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="user-management">
      <div className="user-management-container">
        {/* Header */}
        <div className="user-management-header">
          <div className="user-management-logo-container">
            <img 
              src={encodeURI("/Black and White Filmstrip Modern Logo.png")} 
              alt="MOVIEHUB Logo" 
              className="user-management-logo"
            />
          </div>
          <h1 className="user-management-title">User Management</h1>
          {currentUser && (
            <p className="user-management-email">Logged in as: <strong>{currentUser.email}</strong></p>
          )}
        </div>

        {/* Statistics */}
        <div className="user-stats">
          <div className="user-stat-card">
            <div className="user-stat-icon">👥</div>
            <div className="user-stat-content">
              <h3>{users.length}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="user-stat-card">
            <div className="user-stat-icon">🔍</div>
            <div className="user-stat-content">
              <h3>{filteredUsers.length}</h3>
              <p>Filtered Results</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message">{success}</div>
        )}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Search */}
        <div className="user-search-container">
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-search-input"
          />
        </div>

        {/* Users List */}
        <div className="users-list">
          {loading && users.length === 0 ? (
            <div className="loading-users">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              {users.length === 0 
                ? 'No users found.' 
                : 'No users match your search criteria.'}
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>User ID</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id || user.uid}>
                      <td>
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.displayName || 'User'} 
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar-placeholder">
                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td>{user.displayName || 'N/A'}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td className="user-id-cell">
                        <span className="user-id">{user.uid || user.id || 'N/A'}</span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteUser(user.id || user.uid)}
                          className="delete-user-btn"
                          title="Delete User"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;







