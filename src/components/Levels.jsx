import React, { useState } from 'react';
import { FaMusic, FaStar } from 'react-icons/fa';

const Levels = ({ selectedLevel, onLevelChange }) => {
  // Use internal state if no props provided, otherwise use controlled component pattern
  const [internalSelectedLevel, setInternalSelectedLevel] = useState(null);
  
  const currentLevel = selectedLevel !== undefined ? selectedLevel : internalSelectedLevel;
  
  const handleLevelSelect = (level) => {
    if (selectedLevel !== undefined && onLevelChange) {
      // Controlled component
      onLevelChange(currentLevel === level ? null : level);
    } else {
      // Uncontrolled component
      setInternalSelectedLevel(currentLevel === level ? null : level);
    }
  };

  // Placeholder explanations for each level
  const levelExplanations = {
    1: {
      title: "Beginner - Single Notes",
      description: "Practice reading individual notes in treble clef. Focus on notes within the staff with no accidentals. Perfect for absolute beginners starting their sight-reading journey."
    },
    2: {
      title: "Basic - Simple Rhythms", 
      description: "Introduce basic rhythm patterns with quarter notes and half notes. Simple melodies in C major with minimal hand position changes."
    },
    3: {
      title: "Elementary - Two Hands",
      description: "Begin coordinating both hands with simple bass clef notes. Practice basic intervals and two-note harmonies in major keys."
    },
    4: {
      title: "Intermediate - Accidentals",
      description: "Add sharps and flats to your practice. Work with key signatures up to 2 sharps/flats and more complex rhythm patterns including eighth notes."
    },
    5: {
      title: "Developing - Minor Keys",
      description: "Explore minor key signatures and natural minor scales. Practice more complex hand coordination and simple chord progressions."
    },
    6: {
      title: "Progressing - Extended Rhythms",
      description: "Master dotted rhythms, sixteenth notes, and syncopation. Work with key signatures up to 4 sharps/flats and basic modulations."
    },
    7: {
      title: "Advanced - Complex Harmonies",
      description: "Practice advanced chord progressions, seventh chords, and non-chord tones. Handle all major and minor key signatures confidently."
    },
    8: {
      title: "Proficient - Multiple Voices",
      description: "Read and play multiple independent voice parts. Master advanced rhythmic patterns and complex time signatures like 6/8 and 3/4."
    },
    9: {
      title: "Expert - Chromatic Passages",
      description: "Navigate chromatic passages, advanced modulations, and enharmonic equivalents. Practice sight-reading at moderate to fast tempos."
    },
    10: {
      title: "Master - Professional Level",
      description: "Handle any musical style and complexity. Read dense orchestral reductions, contemporary notation, and maintain accuracy at performance tempo."
    }
  };

  return (
    <div className="levels-component">
      {/* Header Section */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
            <FaStar className="text-white text-xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Select Your Level
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose a difficulty level that matches your current sight-reading ability. 
          Each level focuses on specific skills and musical concepts.
        </p>
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
      {currentLevel && levelExplanations[currentLevel] && (
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
                  {levelExplanations[currentLevel].title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {levelExplanations[currentLevel].description}
                </p>
                <div className="mt-6 flex items-center space-x-4">
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
    </div>
  );
};

export default Levels;