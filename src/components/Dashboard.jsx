import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseService } from '../services/exerciseService';
import { 
  FaHome, 
  FaKeyboard, 
  FaChartBar, 
  FaUser, 
  FaSignOutAlt, 
  FaPlay,
  FaPlus,
  FaMusic,
  FaChartArea,
  FaBars,
  FaSpinner,
  FaTrash
} from 'react-icons/fa';
// Import SVG as URL
import twoNotesRedIcon from '../assets/reshot-icon-music-F6RGPB5VSX.svg';
// import twoNotesPurpleIcon from '.things./assets/reshot-icon-music-FVR3TH9EGY.svg';
import threeNotesIcon from '../assets/reshot-icon-musical-notes-NQYZ4DAWFV.svg';
import fourNotesIcon from '../assets/reshot-icon-musical-note-AT43GFYXHC.svg';
import clefNotesIcon from '../assets/reshot-icon-music-MA3H8WZCPG.svg';
import DeleteExerciseModal from './DeleteExerciseModal';

const Dashboard = ({ settings, onSettingsChange, onLoadExercise }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State for intervals selection page
  const [showIntervalsPage, setShowIntervalsPage] = useState(false);
  
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
        
        const result = await ExerciseService.getUserExercises(user.id);
        
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
  }, [user?.id]);

  // TODO: settings and onSettingsChange will be used for future database integration
  // Currently these props are prepared for future database integration
  console.debug('Dashboard props:', { settings, onSettingsChange });
  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'intervals') {
      navigate('/intervals');
    } else if (categoryId === 'chords') {
      navigate('/chords');
    } else if (categoryId === 'melodic') {
      navigate('/melodic');
    } else if (categoryId === 'clefs') {
      navigate('/free-practice');
    } else {
      console.log(`Category clicked: ${categoryId}`);
    }
  };

  // const handleDrillPlay = () => {
  //   console.log('Playing suggested drill');
  // };

  // const handleAddCustomDrill = () => {
  //   console.log('Adding custom drill');
  // };

  // const handleCustomDrillClick = (drillId) => {
  //   console.log(`Custom drill clicked: ${drillId}`);
  // };

  const handleNavClick = (navItem) => {
    if (navItem === 'practice') {
      navigate('/practice');
    } else {
      console.log(`Navigation clicked: ${navItem}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle loading a saved exercise
  const handleExerciseClick = async (exercise) => {
    try {
      // Convert database exercise back to settings format
      const exerciseSettings = ExerciseService.convertToSettings(exercise);
      
      // If onLoadExercise prop is provided, use it to update settings
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

      const result = await ExerciseService.deleteExercise(exercise.id, user.id);
      
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

  // Intervals page handlers
  const handleBackToMain = () => {
    setShowIntervalsPage(false);
  };

  const handleIntervalToggle = (interval) => {
    const currentIntervals = settings.intervals || [1, 2, 3, 4, 5];
    const newIntervals = currentIntervals.includes(interval)
      ? currentIntervals.filter(i => i !== interval)
      : [...currentIntervals, interval].sort((a, b) => a - b);
    
    if (newIntervals.length > 0) {
      onSettingsChange({ ...settings, intervals: newIntervals });
    }
  };

  const handleIntervalsPractice = () => {
    navigate('/practice', { state: { intervals: settings.intervals } });
  };

  // Interval labels mapping
  const intervalLabels = {
    2: '2nd',
    3: '3rd', 
    4: '4th',
    5: '5th',
    6: '6th',
    7: '7th',
    8: '8th'
  };

  // Render intervals selection page
  if (showIntervalsPage) {
    return (
      <div className="dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="app-title">
              <h1>🎹 Sight Reading Trainer</h1>
            </div>
            <button className="hamburger-button" title="Settings">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </header>

        {/* Intervals Selection Content */}
        <main className="dashboard-main">
          <section className="intervals-page card">
            <div className="intervals-header">
              <button className="back-btn" onClick={handleBackToMain}>
                ← Back
              </button>
            </div>
            
            <h2>Select Intervals</h2>
            
            <div className="intervals-description">
              <p>Choose which intervals you'd like to practice:</p>
            </div>

            <div className="intervals-grid">
              {[2, 3, 4, 5, 6, 7, 8].map(interval => (
                <button
                  key={interval}
                  className={`interval-btn ${(settings.intervals || []).includes(interval) ? 'selected' : ''}`}
                  onClick={() => handleIntervalToggle(interval)}
                >
                  {intervalLabels[interval]}
                </button>
              ))}
            </div>

            <div className="intervals-actions">
              <button 
                className="practice-btn primary"
                onClick={handleIntervalsPractice}
                disabled={(settings.intervals || []).length === 0}
              >
                Practice Selected Intervals
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <FaMusic className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Sight Reading Trainer
              </h1>
            </div>
            <button 
              className="btn btn-ghost btn-square"
              title="Settings"
            >
              <FaBars className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex space-x-1 overflow-x-auto">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => handleNavClick('home')}
              >
                <FaHome className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => handleNavClick('practice')}
              >
                <FaKeyboard className="w-4 h-4" />
                <span className="hidden sm:inline">Practice</span>
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => handleNavClick('stats')}
              >
                <FaChartBar className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => handleNavClick('leaderboard')}
              >
                <FaChartBar className="w-4 h-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => handleNavClick('profile')}
              >
                <FaUser className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                Hi, {user?.name}!
              </span>
              <button 
                className="btn btn-error btn-sm"
                onClick={handleLogout}
                title="Logout"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Welcome Section */}
          <div className="hero bg-blue-600 text-white rounded-2xl animate-fade-in">
            <div className="hero-content text-center py-12 px-8">
              <div className="max-w-md mx-auto">
                <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                <p className="text-blue-100 mb-10">
                  Ready to improve your sight reading skills? Let's continue your musical journey.
                </p>
                
                <button 
                  className="btn btn-white btn-lg px-8 py-4 text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  onClick={() => navigate('/levels')}
                >
                  Start Practice
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <FaChartArea className="text-green-600 text-xl" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pattern Mastery</p>
                    <p className="text-2xl font-bold text-gray-900">68%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '68%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FaKeyboard className="text-blue-600 text-xl" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Last Practice</p>
                    <p className="text-2xl font-bold text-gray-900">July 20</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <FaMusic className="text-purple-600 text-xl" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Exercises Completed</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Categories */}
          <div className="card bg-white shadow-lg animate-scale-in">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6 flex items-center">
                <FaMusic className="mr-3 text-blue-600" />
                Exercise Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="btn btn-outline btn-lg h-auto p-6 text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                  onClick={() => handleCategoryClick('intervals')}
                >
                  <div className="flex items-center w-full">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <img src={twoNotesRedIcon} alt="Music icon" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">Intervals</div>
                      <div className="text-sm text-gray-500">Steps, Skips, Leaps</div>
                    </div>
                  </div>
                </button>

                <button 
                  className="btn btn-outline btn-lg h-auto p-6 text-left hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                  onClick={() => handleCategoryClick('chords')}
                >
                  <div className="flex items-center w-full">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <img src={fourNotesIcon} alt="Music icon" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">Chords</div>
                      <div className="text-sm text-gray-500">Shapes & Arpeggios</div>
                    </div>
                  </div>
                </button>

                <button 
                  className="btn btn-outline btn-lg h-auto p-6 text-left hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                  onClick={() => handleCategoryClick('melodic')}
                >
                  <div className="flex items-center w-full">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <img src={threeNotesIcon} alt="Music icon" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">Melodic Patterns</div>
                      <div className="text-sm text-gray-500">Scales, Sequences</div>
                    </div>
                  </div>
                </button>

                <button 
                  className="btn btn-outline btn-lg h-auto p-6 text-left hover:bg-orange-50 hover:border-orange-300 transition-all duration-300"
                  onClick={() => handleCategoryClick('clefs')}
                >
                  <div className="flex items-center w-full">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                      <img src={clefNotesIcon} alt="Music icon" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">Free Practice</div>
                      <div className="text-sm text-gray-500">Practice Anything</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Exercises */}
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
        </div>
      </main>

      {/* Delete Exercise Modal */}
      <DeleteExerciseModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleDeleteExercise}
        exercise={exerciseToDelete}
      />
    </div>
  );
};

export default Dashboard;