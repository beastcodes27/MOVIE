import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || 'cfe7185111917029d548b5462fb64d51';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

const Profile = () => {
  const { currentUser, logout, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser?.photoURL || '');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDisplayName(currentUser?.displayName || '');
    setEmail(currentUser?.email || '');
    setImagePreview(currentUser?.photoURL || '');
    setRemovePhoto(false);
    setImageFile(null);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      setError('Failed to log out. Please try again.');
    }
  };

  const uploadImageToImgBB = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64String);

        try {
          const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          
          if (data.success && data.data?.url) {
            resolve(data.data.url);
          } else {
            reject(new Error(data.error?.message || 'Failed to upload image'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    try {
      setUploading(true);
      const trimmedName = displayName.trim();
      let photoURL = currentUser?.photoURL || null;

      // Upload new photo if provided
      if (imageFile) {
        photoURL = await uploadImageToImgBB(imageFile);
      }

      // Remove existing photo if requested and no new photo uploaded
      if (!imageFile && removePhoto) {
        photoURL = null;
      }

      await updateUserProfile({ displayName: trimmedName, photoURL });
      setSuccess('Profile updated successfully');
      setError('');
      setIsEditing(false);
      setRemovePhoto(false);
      setImageFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setSuccess('');
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemovePhoto(false);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    setImageFile(null);
    setImagePreview('');
    setRemovePhoto(true);
  };

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <h1>Profile</h1>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile</h1>

        {error && <div className="profile-message error">{error}</div>}
        {success && <div className="profile-message success">{success}</div>}

        <div className="profile-content">
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="profile-avatar-image"
                  onError={() => setImagePreview('')}
                />
              ) : (
                <div className="profile-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="profile-avatar-actions">
                <label className="profile-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                  >
                    Remove Photo
                  </button>
                )}
                <p className="upload-hint">JPG or PNG, up to 5MB.</p>
              </div>
            )}
          </div>

          {/* Profile Info - View Mode */}
          {!isEditing ? (
            <div className="profile-info">
              <h2 className="profile-name">{displayName || 'User'}</h2>
              <div className="profile-details">
                <div className="profile-detail-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span>{email}</span>
                </div>
              </div>

              <div className="profile-actions">
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>

                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>

            </div>
          ) : (
            /* Profile Edit Form */
            <form className="profile-edit-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label htmlFor="displayName">Username</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={uploading}
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

