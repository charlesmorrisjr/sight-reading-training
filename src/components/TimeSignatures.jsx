import React from 'react';
import { AVAILABLE_TIME_SIGNATURES } from '../utils/musicGenerator';

const TimeSignatures = ({ 
  selectedTimeSignature = '4/4', 
  onTimeSignatureChange
}) => {
  // All available time signatures
  const timeSignatures = AVAILABLE_TIME_SIGNATURES;

  const handleTimeSignatureClick = (timeSignature) => {
    if (!onTimeSignatureChange) return;
    // Single selection mode - pass time signature string directly
    onTimeSignatureChange(timeSignature);
  };

  const renderTimeSignatureButton = (timeSignature) => {
    const isSelected = selectedTimeSignature === timeSignature;

    return (
      <button
        key={timeSignature}
        className={`btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => handleTimeSignatureClick(timeSignature)}
        aria-pressed={isSelected}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className="font-bold text-center text-2xl">{timeSignature}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Select Time Signature
        </h3>
      </div>

      {/* Time Signatures Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {timeSignatures.map(renderTimeSignatureButton)}
      </div>
    </div>
  );
};

export default TimeSignatures;