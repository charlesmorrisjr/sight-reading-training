import React from 'react';

const Keys = ({ 
  selectedKeys = [], 
  onKeyToggle, 
  allowMultiple = false, 
  showRandom = true 
}) => {
  // All major keys from MAJOR_SCALE_DEGREES
  const majorKeys = [
    { key: 'C', label: 'C' },
    { key: 'C#', label: 'C#' },
    { key: 'D', label: 'D' },
    { key: 'D#', label: 'D#' },
    { key: 'E', label: 'E' },
    { key: 'F', label: 'F' },
    { key: 'F#', label: 'F#' },
    { key: 'G', label: 'G' },
    { key: 'G#', label: 'G#' },
    { key: 'A', label: 'A' },
    { key: 'A#', label: 'A#' },
    { key: 'B', label: 'B' }
  ];

  // All minor keys from MINOR_SCALE_DEGREES
  const minorKeys = [
    { key: 'Am', label: 'Am' },
    { key: 'A#m', label: 'A#m' },
    { key: 'Bm', label: 'Bm' },
    { key: 'Cm', label: 'Cm' },
    { key: 'C#m', label: 'C#m' },
    { key: 'Dm', label: 'Dm' },
    { key: 'D#m', label: 'D#m' },
    { key: 'Em', label: 'Em' },
    { key: 'Fm', label: 'Fm' },
    { key: 'F#m', label: 'F#m' },
    { key: 'Gm', label: 'Gm' },
    { key: 'G#m', label: 'G#m' }
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
      // Single selection mode - pass single key string
      onKeyToggle(key);
    } else {
      // Multiple selection mode - pass array of keys
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

    return (
      <button
        key={key}
        className={`btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => handleKeyClick(key)}
        aria-pressed={isSelected}
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="font-bold text-center text-2xl">{label}</span>
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
      </div>

      {/* Major Keys Section */}
      <div>
        <h4 className="text-xl font-semibold text-gray-700 mb-3">Major Keys</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {majorKeys.map(renderKeyButton)}
        </div>
      </div>

      {/* Minor Keys Section */}
      <div>
        <h4 className="text-xl font-semibold text-gray-700 mb-3">Minor Keys</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {minorKeys.map(renderKeyButton)}
        </div>
      </div>

      {/* Random Option */}
      {showRandom && (
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3">Special</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {renderKeyButton(randomOption)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Keys;