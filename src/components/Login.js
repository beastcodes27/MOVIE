import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

// Floating Logo Bubbles Component
const FloatingLogoBubbles = () => {
  const bubbles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 30, // Random size between 30-70px
    left: Math.random() * 100, // Random horizontal position
    duration: Math.random() * 20 + 15, // Random animation duration 15-35s
    delay: Math.random() * 5, // Random delay 0-5s
    opacity: Math.random() * 0.3 + 0.1, // Random opacity 0.1-0.4
  }));

  return (
    <div className="floating-bubbles-container">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="floating-logo-bubble"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
            opacity: bubble.opacity,
          }}
        >
          <img 
            src="/Black and White Filmstrip Modern Logo.png" 
            alt="Logo"
            className="bubble-logo"
          />
        </div>
      ))}
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      if (isSignUp) {
        if (!username || !email || !password) {
          setError('Please fill in all fields');
          return;
        }
        await signup(email, password, username);
      } else {
        await login(email, password);
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <FloatingLogoBubbles />
      <div className="login-box">
        <h1 className="login-title">MOVIEHUB</h1>
        <h2 className="login-subtitle">{isSignUp ? 'Sign Up' : 'Login'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="google-button"
        >
          Continue with Google
        </button>

        <p className="toggle-auth">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="toggle-link"
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

