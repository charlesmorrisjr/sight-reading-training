import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaTrash, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const DeleteExerciseModal = ({ 
  isOpen, 
  onClose, 
  onDelete, 
  exercise 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = useCallback(() => {
    if (isDeleting) return; // Prevent closing during deletion
    
    setError('');
    setIsDeleting(false);
    onClose();
  }, [onClose, isDeleting]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Close modal on escape key (only if not deleting)
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen && !isDeleting) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleCancel, isDeleting]);

  const handleDelete = async () => {
    if (!onDelete || !exercise) return;

    setIsDeleting(true);
    setError('');

    try {
      const result = await onDelete(exercise);
      
      if (result && result.success === false) {
        setError(result.error || 'Failed to delete exercise');
        setIsDeleting(false);
      } else {
        // Success - close modal (parent will handle UI updates)
        handleCancel();
      }
    } catch (err) {
      console.error('Error in handleDelete:', err);
      setError('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !exercise) return null;

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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3" />
            Delete Exercise
          </h2>
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the exercise:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="font-semibold text-lg text-gray-900 mb-2">
              "{exercise.exercise_name}"
            </div>
            <div className="text-sm text-gray-600">
              {exercise.key_signature} • {exercise.time_signature} • {exercise.measures} measures
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Created on {new Date(exercise.created_at).toLocaleDateString()}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-error"
          >
            {isDeleting ? (
              <>
                <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Exercise
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteExerciseModal;