import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

const SaveExerciseModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialValue = '' 
}) => {
  const [exerciseName, setExerciseName] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = useCallback(() => {
    setExerciseName('');
    setError('');
    setIsLoading(false);
    onClose();
  }, [onClose]);

  // Update local state when modal opens with initial value
  useEffect(() => {
    if (isOpen) {
      setExerciseName(initialValue);
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, initialValue]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleCancel]);

  const handleSave = async () => {
    if (!exerciseName.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (!onSave) return;

    setIsLoading(true);
    setError('');

    try {
      // Modify the onSave prop to return a result object
      const result = await onSave(exerciseName.trim());
      
      if (result && result.success === false) {
        setError(result.error || 'Failed to save exercise');
        setIsLoading(false);
      } else {
        // Success - close modal and reset
        handleCancel();
      }
    } catch (err) {
      console.error('Error in handleSave:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleCancel}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Save Exercise</h2>
          <button
            onClick={handleCancel}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Exercise name input */}
        <div className="mb-6">
          <label htmlFor="exercise-name" className="block text-sm font-medium text-gray-700 mb-2">
            Exercise Name
          </label>
          <input
            id="exercise-name"
            type="text"
            placeholder="Enter exercise name..."
            value={exerciseName}
            onChange={(e) => {
              setExerciseName(e.target.value);
              if (error) setError(''); // Clear error when user types
            }}
            onKeyPress={handleKeyPress}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!exerciseName.trim() || isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FaSave className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveExerciseModal;