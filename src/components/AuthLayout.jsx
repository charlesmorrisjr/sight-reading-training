import React from 'react';
import { Link } from 'react-router-dom';
import { FaMusic } from 'react-icons/fa';

const AuthLayout = ({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-white shadow-xl">
          <div className="card-body p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <FaMusic className="text-white text-2xl" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sight Reading Trainer
              </h1>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Content */}
            <div className="mb-6">
              {children}
            </div>
            
            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              <p>
                {footerText}{' '}
                <Link 
                  to={footerLinkTo} 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;