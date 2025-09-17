import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const TempoSelector = ({ tempo, onTempoChange, onClose }) => {
  // Local state to track tempo changes within the modal
  const [localTempo, setLocalTempo] = useState(tempo);

  // Update local tempo when the modal opens with a new tempo value
  useEffect(() => {
    setLocalTempo(tempo);
  }, [tempo]);

  const handleSliderChange = (e) => {
    const newTempo = parseInt(e.target.value);
    setLocalTempo(newTempo);
  };

  const handlePresetClick = (presetTempo) => {
    setLocalTempo(presetTempo);
  };

  const handleClose = () => {
    // Commit the changes when modal closes
    onTempoChange(localTempo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tempo</h2>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tempo Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {localTempo}
          </div>
          <div className="text-gray-600 dark:text-gray-300 text-lg">BPM</div>
        </div>

        {/* Tempo Slider */}
        <div className="mb-6">
          <input
            type="range"
            min="40"
            max="200"
            value={localTempo}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
            <span>40</span>
            <span>120</span>
            <span>200</span>
          </div>
        </div>

        {/* Tempo presets */}
        <div className="grid grid-cols-3 gap-2">
          {[60, 80, 100, 120, 140, 160].map(presetTempo => (
            <button
              key={presetTempo}
              onClick={() => handlePresetClick(presetTempo)}
              className={`btn btn-sm ${localTempo === presetTempo ? 'btn-primary' : 'btn-outline'}`}
            >
              {presetTempo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TempoSelector;