import React from 'react';
import { FaTimes } from 'react-icons/fa';

const TempoSelector = ({ tempo, onTempoChange, onClose }) => {
  const handleSliderChange = (e) => {
    const newTempo = parseInt(e.target.value);
    onTempoChange(newTempo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Tempo</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Tempo Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {tempo}
          </div>
          <div className="text-gray-600 text-lg">BPM</div>
        </div>

        {/* Tempo Slider */}
        <div className="mb-6">
          <input
            type="range"
            min="40"
            max="200"
            value={tempo}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((tempo - 40) / 160) * 100}%, #e5e7eb ${((tempo - 40) / 160) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
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
              onClick={() => onTempoChange(presetTempo)}
              className={`btn btn-sm ${tempo === presetTempo ? 'btn-primary' : 'btn-outline'}`}
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