import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseService } from '../services/exerciseService';
import { loadGuestExercises, deleteGuestExercise } from '../services/settingsService';
import { FaMusic, FaSpinner, FaTrash } from 'react-icons/fa';
import DeleteExerciseModal from './DeleteExerciseModal';

const SavedExercisesCard = ({ user, onExerciseClick, onLoadExercise, onSettingsChange }) => {
  const navigate = useNavigate();
  
  // State for saved exercises
  const [savedExercises, setSavedExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState('');
  
  // State for delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  
  // Load saved exercises on component mount
  useEffect(() => {
    const loadExercises = async () => {
      if (!user?.id) {
        setExercisesLoading(false);
        return;
      }

      try {
        setExercisesLoading(true);
        setExercisesError('');
        
        let result;
        if (user.isGuest) {
          // Load exercises from localStorage for guest users
          result = loadGuestExercises();
          // Rename 'exercises' to 'data' to match expected format
          result = { success: result.success, data: result.exercises };
        } else {
          // Load exercises from database for authenticated users
          result = await ExerciseService.getUserExercises(user.id);
        }
        
        if (result.success) {
          setSavedExercises(result.data || []);
        } else {
          setExercisesError(result.error || 'Failed to load exercises');
          setSavedExercises([]);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
        setExercisesError('An unexpected error occurred while loading exercises');
        setSavedExercises([]);
      } finally {
        setExercisesLoading(false);
      }
    };

    loadExercises();
  }, [user?.id, user?.isGuest]);

  // Handle loading a saved exercise
  const handleExerciseClick = async (exercise) => {
    try {
      // Convert database exercise back to settings format
      const exerciseSettings = ExerciseService.convertToSettings(exercise);
      
      // Use the provided onExerciseClick handler first
      if (onExerciseClick) {
        onExerciseClick(exercise, exerciseSettings);
        return;
      }
      
      // Fallback to the original Dashboard logic
      if (onLoadExercise) {
        onLoadExercise(exerciseSettings);
      } else {
        // Fallback: use onSettingsChange if available
        onSettingsChange && onSettingsChange(exerciseSettings);
      }
      
      // Navigate to practice page
      navigate('/practice');
    } catch (error) {
      console.error('Error loading exercise:', error);
      alert('Failed to load exercise. Please try again.');
    }
  };

  // Handle delete button click
  const handleDeleteClick = (e, exercise) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering the exercise click
    
    setExerciseToDelete(exercise);
    setDeleteModalOpen(true);
  };

  // Handle closing delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setExerciseToDelete(null);
  };

  // Handle actual deletion
  const handleDeleteExercise = async (exercise) => {
    try {
      if (!user?.id) {
        return { success: false, error: 'You must be logged in to delete exercises.' };
      }

      let result;
      if (user.isGuest) {
        // Delete exercise from localStorage for guest users
        result = deleteGuestExercise(exercise.id);
      } else {
        // Delete exercise from database for authenticated users
        result = await ExerciseService.deleteExercise(exercise.id, user.id);
      }
      
      if (result.success) {
        // Remove from local state immediately
        setSavedExercises(prev => prev.filter(ex => ex.id !== exercise.id));
        
        console.log('Exercise deleted successfully');
        return { success: true };
      } else {
        console.error('Delete failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return { success: false, error: 'An unexpected error occurred while deleting the exercise.' };
    }
  };

  return (
    <>
      {/* Saved Exercises Card */}
      <div className="card bg-white shadow-lg animate-scale-in">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6 flex items-center">
            <FaMusic className="mr-3 text-blue-600" />
            Saved Exercises
          </h2>

          {exercisesLoading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
              <span className="text-gray-600">Loading exercises...</span>
            </div>
          ) : exercisesError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{exercisesError}</p>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : savedExercises.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No exercises saved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedExercises.map((exercise) => (
                <div key={exercise.id} className="relative">
                  <button
                    className="btn btn-outline btn-lg h-auto p-4 text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 w-full pr-12"
                    onClick={() => handleExerciseClick(exercise)}
                  >
                    <div className="w-full">
                      <div className="font-semibold text-base mb-1">{exercise.exercise_name}</div>
                      <div className="text-sm text-gray-500">
                        {exercise.key_signature} • {exercise.time_signature} • {exercise.measures} measures
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(exercise.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                  
                  {/* Delete button */}
                  <button
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                    onClick={(e) => handleDeleteClick(e, exercise)}
                    title="Delete exercise"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Exercise Modal */}
      <DeleteExerciseModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleDeleteExercise}
        exercise={exerciseToDelete}
      />
    </>
  );
};

export default SavedExercisesCard;