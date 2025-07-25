import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setAuthError('');
    const result = await login(data.email, data.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setAuthError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    const result = await loginWithGoogle();
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setAuthError(result.error || 'Google login failed. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your sight reading practice"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/signup"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        {authError && (
          <div className="auth-error">
            {authError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && (
            <span className="form-error">{errors.email.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <span className="form-error">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isSubmitting || loading}
        >
          {isSubmitting || loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="google-auth-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <FaGoogle className="google-icon" />
          Continue with Google
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;