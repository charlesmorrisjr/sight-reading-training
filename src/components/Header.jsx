import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMusic, FaSignOutAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ showLogout = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <FaMusic className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Practisia
            </h1>
          </button>
          
          {showLogout && (
            <div className="flex items-center space-x-10">
              {user?.isGuest ? (
                <button 
                  className="btn btn-lg"
                  onClick={handleSignUp}
                  title="Sign Up"
                >
                  <FaUserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </button>
              ) : (
                <button 
                  className="btn btn-lg"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;