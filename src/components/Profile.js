import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { uploadImageToImgBB } from '../services/imgbbService';
import { getUserTransactionHistory } from '../services/purchaseService';
import { formatPrice } from '../utils/currency';
import './Profile.css';

const Profile = () => {
  const { currentUser, updateUserProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(data);
          setImagePreview(data.profilePicture || currentUser.photoURL || null);
          setFormData({
            displayName: data.displayName || currentUser.displayName || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        } else {
          // Create profile if it doesn't exist
          const initialData = {
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            profilePicture: currentUser.photoURL || '',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, initialData);
          setProfileData(initialData);
          setImagePreview(initialData.profilePicture || null);
          setFormData({
            displayName: initialData.displayName,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  // Fetch transaction history
  const fetchTransactions = async () => {
    if (!currentUser) return;
    
    setLoadingTransactions(true);
    try {
      const transactionHistory = await getUserTransactionHistory(currentUser.uid);
      setTransactions(transactionHistory);
    } catch (err) {
      console.error('Error loading transaction history:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle image selection (preview only)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid image type. Please upload JPEG, PNG, GIF, or WebP images.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Image size too large. Maximum size is 10MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file || !currentUser) return;

    setError('');
    setUploading(true);

    try {
      // Upload to imgBB
      const uploadResult = await uploadImageToImgBB(file);

      if (uploadResult.success) {
        // Save to Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const updateData = {
          profilePicture: uploadResult.imageUrl,
          updatedAt: new Date().toISOString(),
        };

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          await updateDoc(userDocRef, updateData);
        } else {
          await setDoc(userDocRef, {
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            profilePicture: uploadResult.imageUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Update local state
        setProfileData(prev => ({
          ...prev,
          profilePicture: uploadResult.imageUrl,
        }));
        setImagePreview(uploadResult.imageUrl);
        return uploadResult.imageUrl;
      }
    } catch (err) {
      console.error('Upload error:', err);
      throw new Error(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle save profile changes
  const handleSave = async () => {
    if (!currentUser) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updates = {};
      let profilePictureUrl = imagePreview;

      // Validate display name
      if (formData.displayName.trim().length < 2) {
        throw new Error('Username must be at least 2 characters long');
      }

      // Update display name if changed
      if (formData.displayName !== (profileData?.displayName || currentUser.displayName || '')) {
        // Update Firebase Auth profile
        await updateUserProfile(formData.displayName.trim());
        updates.displayName = formData.displayName.trim();
      }

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (!formData.currentPassword) {
          throw new Error('Please enter your current password to change it');
        }

        await changePassword(formData.currentPassword, formData.newPassword);
        setSuccess('Password updated successfully!');
      }

      // Check if profile picture changed (new upload)
      const fileInput = document.getElementById('profile-upload');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        profilePictureUrl = await handleImageUpload(fileInput.files[0]);
        updates.profilePicture = profilePictureUrl;
      }

      // Update Firestore
      if (Object.keys(updates).length > 0 || profilePictureUrl !== (profileData?.profilePicture || '')) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        updates.updatedAt = new Date().toISOString();
        
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          await updateDoc(userDocRef, updates);
        } else {
          await setDoc(userDocRef, {
            displayName: formData.displayName.trim(),
            email: currentUser.email || '',
            profilePicture: profilePictureUrl || '',
            createdAt: new Date().toISOString(),
            ...updates,
          });
        }

        // Update local state
        setProfileData(prev => ({
          ...prev,
          ...updates,
          profilePicture: profilePictureUrl || prev?.profilePicture,
        }));
      }

      setSuccess(success || 'Profile updated successfully!');
      setIsEditing(false);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    // Reset form data
    setFormData({
      displayName: profileData?.displayName || currentUser?.displayName || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setImagePreview(profileData?.profilePicture || currentUser?.photoURL || null);
    setError('');
    setIsEditing(false);
    
    // Reset file input
    const fileInput = document.getElementById('profile-upload');
    if (fileInput) fileInput.value = '';
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  const displayName = profileData?.displayName || currentUser?.displayName || 'User';
  const email = profileData?.email || currentUser?.email || '';
  const profilePicture = imagePreview || profileData?.profilePicture || currentUser?.photoURL || null;
  const isGoogleUser = currentUser?.providerData?.[0]?.providerId === 'google.com';

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile</h1>
        </div>

        {loading ? (
          <div className="loading">Loading profile...</div>
        ) : currentUser ? (
          <div className="profile-content">
            {/* Profile Picture */}
            <div className="profile-avatar-container">
              <div className="profile-avatar-wrapper">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="profile-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="profile-avatar"
                  style={{ display: profilePicture ? 'none' : 'flex' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              </div>

              {/* Edit Profile Button - Below photo, only in view mode */}
              {!isEditing && currentUser && (
                <button 
                  className="edit-profile-btn" 
                  onClick={() => setIsEditing(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit Profile
                </button>
              )}

              {/* Upload Button - Only show in edit mode */}
              {isEditing && (
                <label htmlFor="profile-upload" className="profile-upload-btn" disabled={uploading}>
                  {uploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span>Change Photo</span>
                    </>
                  )}
                </label>
              )}
              <input
                id="profile-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                disabled={uploading || !isEditing}
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="profile-message error">
                {error}
              </div>
            )}
            {success && (
              <div className="profile-message success">
                {success}
              </div>
            )}

            {/* Profile Info - View Mode */}
            {!isEditing ? (
              <div className="profile-info">
                <h2 className="profile-name">{displayName}</h2>
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>{email}</span>
                  </div>
                </div>
                
                {/* Transaction History Button */}
                <button 
                  className="transactions-btn" 
                  onClick={() => setShowTransactions(!showTransactions)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showTransactions ? 'Hide' : 'Show'} Purchase History
                </button>

                {/* Logout Button */}
                <button 
                  className="logout-btn" 
                  onClick={handleLogout}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Logout
                </button>
              </div>

              {/* Transaction History Section */}
              {showTransactions && (
                <div className="transactions-section">
                  <h3 className="transactions-title">Purchase History</h3>
                  {loadingTransactions ? (
                    <div className="loading">Loading transactions...</div>
                  ) : transactions.length === 0 ? (
                    <div className="no-transactions">
                      <p>No purchases yet. Start exploring movies to make your first purchase!</p>
                    </div>
                  ) : (
                    <div className="transactions-list">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-item">
                          {transaction.movie?.posterImage && (
                            <img 
                              src={transaction.movie.posterImage} 
                              alt={transaction.movie.movieName || 'Movie'} 
                              className="transaction-poster"
                            />
                          )}
                          <div className="transaction-details">
                            <h4 className="transaction-movie-name">
                              {transaction.movie?.movieName || 'Movie Deleted'}
                            </h4>
                            <div className="transaction-info">
                              <span className="transaction-price">
                                {formatPrice(transaction.price || 0)}
                              </span>
                              <span className="transaction-date">
                                {new Date(transaction.purchasedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {transaction.transactionId && (
                              <div className="transaction-id">
                                <span>Transaction ID:</span>
                                <code>{transaction.transactionId}</code>
                              </div>
                            )}
                            <div className="transaction-status">
                              <span className={`status-badge ${transaction.status || 'completed'}`}>
                                {transaction.status || 'Completed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            ) : (
              /* Profile Edit Form */
              <form className="profile-edit-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="form-group">
                  <label htmlFor="displayName">Username</label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    required
                    minLength={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>

                {/* Password Change Section - Only for email/password users */}
                {!isGoogleUser && (
                  <div className="password-section">
                    <h3>Change Password</h3>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Enter new password (min 6 characters)"
                        minLength={6}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                        minLength={6}
                      />
                    </div>
                    <small className="password-hint">Leave password fields empty if you don't want to change it</small>
                  </div>
                )}

                {isGoogleUser && (
                  <div className="info-message">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    Password changes are not available for Google accounts. Change your password in your Google account settings.
                  </div>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={saving || uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={saving || uploading}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p>Please log in to view your profile.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
