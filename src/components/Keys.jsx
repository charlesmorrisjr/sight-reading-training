import React from 'react';
import { FaDice } from 'react-icons/fa';

const Keys = ({ 
  selectedKeys = [], 
  onKeyToggle, 
  allowMultiple = true, 
  showRandom = true 
}) => {
  // All major keys from MAJOR_SCALE_DEGREES
  const majorKeys = [
    { key: 'C', label: 'C Major' },
    { key: 'C#', label: 'C# Major' },
    { key: 'D', label: 'D Major' },
    { key: 'D#', label: 'D# Major' },
    { key: 'E', label: 'E Major' },
    { key: 'F', label: 'F Major' },
    { key: 'F#', label: 'F# Major' },
    { key: 'G', label: 'G Major' },
    { key: 'G#', label: 'G# Major' },
    { key: 'A', label: 'A Major' },
    { key: 'A#', label: 'A# Major' },
    { key: 'B', label: 'B Major' }
  ];

  // All minor keys from MINOR_SCALE_DEGREES
  const minorKeys = [
    { key: 'Am', label: 'A Minor' },
    { key: 'A#m', label: 'A# Minor' },
    { key: 'Bm', label: 'B Minor' },
    { key: 'Cm', label: 'C Minor' },
    { key: 'C#m', label: 'C# Minor' },
    { key: 'Dm', label: 'D Minor' },
    { key: 'D#m', label: 'D# Minor' },
    { key: 'Em', label: 'E Minor' },
    { key: 'Fm', label: 'F Minor' },
    { key: 'F#m', label: 'F# Minor' },
    { key: 'Gm', label: 'G Minor' },
    { key: 'G#m', label: 'G# Minor' }
  ];

  // Random option
  const randomOption = { key: 'random', label: 'Random' };

  // Combine all keys
  const allKeys = [...majorKeys, ...minorKeys];
  if (showRandom) {
    allKeys.push(randomOption);
  }

  const handleKeyClick = (key) => {
    if (!onKeyToggle) return;

    if (!allowMultiple) {
      // Single selection mode
      onKeyToggle([key]);
    } else {
      // Multiple selection mode
      const isSelected = selectedKeys.includes(key);
      if (isSelected) {
        onKeyToggle(selectedKeys.filter(k => k !== key));
      } else {
        onKeyToggle([...selectedKeys, key]);
      }
    }
  };

  const renderKeyButton = ({ key, label }) => {
    const isSelected = selectedKeys.includes(key);
    const isRandom = key === 'random';

    return (
      <button
        key={key}
        className={`btn btn-lg h-auto py-6 px-4 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => handleKeyClick(key)}
        aria-pressed={isSelected}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isSelected 
              ? 'bg-white text-blue-600' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            {isRandom ? (
              <FaDice className="text-xs" />
            ) : (
              key.replace('m', '')
            )}
          </div>
          <span className="font-medium text-center text-sm">{label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Select Key Signature
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Choose which key you'd like to practice in.
        </p>
        
        {/* Selected Count Badge */}
        <div className="inline-flex items-center space-x-2 mb-6">
          <span className="text-sm text-gray-500">Selected:</span>
          <div className="badge badge-primary badge-lg">
            {selectedKeys.length} {selectedKeys.length === 1 ? 'key' : 'keys'}
          </div>
        </div>
      </div>

      {/* Major Keys Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Major Keys</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {majorKeys.map(renderKeyButton)}
        </div>
      </div>

      {/* Minor Keys Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Minor Keys</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {minorKeys.map(renderKeyButton)}
        </div>
      </div>

      {/* Random Option */}
      {showRandom && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-3">Special</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {renderKeyButton(randomOption)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Keys;