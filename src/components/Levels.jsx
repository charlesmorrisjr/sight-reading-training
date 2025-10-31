import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaStar } from 'react-icons/fa';
import { getLevelMetadata } from '../config/levelConfigurations';

const Levels = ({ selectedLevel, onLevelChange }) => {
  const navigate = useNavigate();
  
  // Use internal state if no props provided, otherwise use controlled component pattern
  const [internalSelectedLevel, setInternalSelectedLevel] = useState(null);
  
  const currentLevel = selectedLevel !== undefined ? selectedLevel : internalSelectedLevel;
  
  const handleBackClick = () => {
    navigate('/dashboard');
  };
  
  const handleLevelSelect = (level) => {
    if (selectedLevel !== undefined && onLevelChange) {
      // Controlled component
      onLevelChange(currentLevel === level ? null : level);
    } else {
      // Uncontrolled component
      setInternalSelectedLevel(currentLevel === level ? null : level);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Back Button */}
            <button 
              className="btn btn-ghost btn-sm"
              onClick={handleBackClick}
              aria-label="Back to Dashboard"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            {/* Spacer for centering */}
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="card bg-white shadow-lg mb-8 animate-fade-in">
          <div className="card-body p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Choose Your Difficulty Level
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose a difficulty level that matches your current sight-reading ability. 
              Each level focuses on specific skills and musical concepts.
            </p>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="card bg-white shadow-lg mb-8 animate-fade-in">
          <div className="card-body p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                const isSelected = currentLevel === level;
                return (
                  <button
                    key={level}
                    className={`btn btn-lg h-20 transition-all duration-300 transform hover:scale-105 ${
                      isSelected 
                        ? 'btn-primary shadow-lg scale-105' 
                        : 'btn-outline hover:btn-primary'
                    }`}
                    onClick={() => handleLevelSelect(level)}
                    aria-label={`Select level ${level}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold">
                        {level}
                      </span>
                      <span className="text-xs opacity-75">
                        Level
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Explanation Card */}
        {currentLevel && getLevelMetadata(currentLevel) && (
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg animate-fade-in">
            <div className="card-body p-8">
              <div className="flex items-start space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex-shrink-0">
                  <span className="text-white text-2xl font-bold">
                    {currentLevel}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="card-title text-xl mb-3">
                    {getLevelMetadata(currentLevel)?.levelName}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {getLevelMetadata(currentLevel)?.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <FaMusic className="text-blue-500" />
                        <span className="text-sm text-gray-600">
                          Level {currentLevel} Practice
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(10)].map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index < currentLevel
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/flow?level=${currentLevel}`)}
                      aria-label={`Start Flow Practice for Level ${currentLevel}`}
                    >
                      Start Flow Practice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!currentLevel && (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-gray-400 mb-4">
              <FaMusic className="text-6xl mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                Select a level above to see what you'll practice
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Levels;