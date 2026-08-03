import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';
import whiteDogGif from './White Dog.gif';
import { login as loginRequest } from './api';
import './login.css';
import './dashboard.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginRequest(username, password);

      if (data.success) {
        // Store JWT token and user info
        localStorage.setItem('petmate_token', data.token);
        localStorage.setItem('petmate_user', JSON.stringify(data.user));

        // Clear form
        setUsername('');
        setPassword('');

        // Redirect based on role
        switch (data.user.role) {
          case 'admin':
            navigate('/admin-dashboard');
            break;
          case 'rescue_org':
            navigate('/rescue-dashboard');
            break;
          case 'pet_center':
            navigate('/center-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark"><FontAwesomeIcon icon={faPaw} /></span>
          <span className="login-brand-name">PetMate</span>
        </div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to manage adoptions, pets, and volunteers.</p>

        <div className="role-info">
          <p>Demo accounts</p>
          <ul>
            <li><strong>Admin:</strong> admin / password123</li>
            <li><strong>Rescue Org:</strong> rescue1 / password123</li>
            <li><strong>Pet Center:</strong> center1 / password123</li>
          </ul>
        </div>

        <div className="field login-field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>
        <div className="field login-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary login-submit"
        >
          {loading && <span className="spinner" />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="login-visual">
        <img src={whiteDogGif} alt="Happy adopted dog" />
      </div>
    </div>
  );
};

export default Login;
