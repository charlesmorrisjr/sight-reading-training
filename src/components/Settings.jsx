import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = ({ settings }) => {
  const navigate = useNavigate();

  return (
    <div className="card bg-white shadow-lg mb-8 mt-8 animate-slide-up">
      <div className="card-body p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Selection Button */}
          <button
            className="btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 btn-outline btn-secondary hover:btn-secondary"
            onClick={() => navigate('/keys')}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Selected Key</span>
              <span className="text-lg font-bold">{settings.key}</span>
            </div>
          </button>

          {/* Time Signature Selection Button */}
          <button
            className="btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 btn-outline btn-secondary hover:btn-secondary"
            onClick={() => navigate('/time-signatures')}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Selected Time Signature</span>
              <span className="text-lg font-bold">{settings.timeSignature}</span>
            </div>
          </button>

          {/* Measures Selection Button */}
          <button
            className="btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 btn-outline btn-secondary hover:btn-secondary"
            onClick={() => navigate('/measures')}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Selected Measures</span>
              <span className="text-lg font-bold">{settings.measures || 8}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;