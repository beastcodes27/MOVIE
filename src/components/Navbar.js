import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const adminEmails = ['imanibraah@gmail.com'];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isAdmin = currentUser && adminEmails.includes(currentUser.email);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          MOVIEHUB
        </Link>
        
        <div className="navbar-menu">
          {currentUser && (
            <>
              <span className="navbar-user">Welcome, {currentUser.displayName || currentUser.email}</span>
              {isAdmin && (
                <Link to="/admin" className="navbar-link">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

