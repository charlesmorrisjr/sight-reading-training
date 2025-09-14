import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/useTheme';

const DarkModeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <FaSun className="w-5 h-5 text-yellow-500 hover:text-yellow-400 transition-colors" />
      ) : (
        <FaMoon className="w-5 h-5 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors" />
      )}
    </button>
  );
};

export default DarkModeToggle;