import React from 'react';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = ({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="app-logo">🎹 Sight Reading Trainer</h1>
          <h2 className="auth-title">{title}</h2>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        
        <div className="auth-content">
          {children}
        </div>
        
        <div className="auth-footer">
          <p>
            {footerText}{' '}
            <Link to={footerLinkTo} className="auth-link">
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;