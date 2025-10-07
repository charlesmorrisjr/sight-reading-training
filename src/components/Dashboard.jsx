import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/database';
import { loadGuestExercisesGenerated } from '../services/settingsService';
import { 
  FaHome, 
  FaKeyboard, 
  FaChartBar, 
  FaUser, 
  FaMusic,
  FaChartArea,
  FaBars
} from 'react-icons/fa';
import Header from './Header';
// Import SVG as URL
// import twoNotesRedIcon from '../assets/reshot-icon-music-F6RGPB5VSX.svg';
// import threeNotesIcon from '../assets/reshot-icon-musical-notes-NQYZ4DAWFV.svg';
// import fourNotesIcon from '../assets/reshot-icon-musical-note-AT43GFYXHC.svg';
// import clefNotesIcon from '../assets/reshot-icon-music-MA3H8WZCPG.svg';
// import twoNotesPurpleIcon from '.things./assets/reshot-icon-music-FVR3TH9EGY.svg';
import SavedExercisesCard from './SavedExercisesCard';

const Dashboard = ({ settings, onSettingsChange, onLoadExercise }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for user profile data
  const [exercisesGenerated, setExercisesGenerated] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  // TODO: settings and onSettingsChange will be used for future database integration
  // Currently these props are prepared for future database integration
  console.debug('Dashboard props:', { settings, onSettingsChange });
  /* For exercise categories
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
  */


  // Fetch user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        setProfileLoading(false);
        return;
      }

      // Handle guest users - load from localStorage
      if (user.isGuest) {
        const guestResult = loadGuestExercisesGenerated();
        setExercisesGenerated(guestResult.count);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const result = await getUserProfile(user.id);
        
        if (result.success) {
          setExercisesGenerated(result.profile?.exercises_generated || 0);
        } else {
          console.error('Failed to load profile:', result.error);
          setExercisesGenerated(0);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setExercisesGenerated(0);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id, user?.isGuest]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header showLogout={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Welcome Section */}
          <div className="hero bg-blue-600 text-white rounded-2xl animate-fade-in">
            <div className="hero-content text-center py-12 px-8">
              <div className="max-w-xl mx-auto">
                <h1 className="text-4xl font-bold mb-4">Welcome back, {user?.name}!</h1>
                <p className="text-blue-100">
                  Ready to improve your sight reading skills? Let's continue your musical journey.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            <div className="card bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/25 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FaKeyboard className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Practice</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">July 20</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/25 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <FaMusic className="text-purple-600 dark:text-purple-400 text-xl" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Exercises Generated</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profileLoading ? '...' : exercisesGenerated}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
            {/* Flow Mode Card */}
            <div className="card bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/25 hover:shadow-xl transition-all duration-300">
              <div className="card-body p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-3">
                    <FaChartArea className="text-purple-600 dark:text-purple-400 text-lg" />
                  </div>
                  Flow Mode
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Continuous practice with progressive difficulty levels
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    className="btn btn-outline btn-primary btn-lg w-full"
                    onClick={() => navigate('/levels')}
                  >
                    Select Level
                  </button>
                  <button
                    className="btn btn-primary btn-lg w-full"
                    onClick={() => navigate('/flow')}
                  >
                    Start Practice
                  </button>
                </div>
              </div>
            </div>

            {/* Exercise Mode Card */}
            <div className="card bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/25 hover:shadow-xl transition-all duration-300">
              <div className="card-body p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-3">
                    <FaKeyboard className="text-green-600 dark:text-green-400 text-lg" />
                  </div>
                  Exercise Mode
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Customize your practice with specific settings
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    className="btn btn-outline btn-primary btn-lg w-full"
                    onClick={() => navigate('/free-practice')}
                  >
                    Change Settings
                  </button>
                  <button
                    className="btn btn-primary btn-lg w-full"
                    onClick={() => navigate('/practice')}
                  >
                    Start Practice
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Exercises */}
          <SavedExercisesCard 
            user={user}
            onLoadExercise={onLoadExercise}
            onSettingsChange={onSettingsChange}
          />
        </div>
      </main>

    </div>
  );
};

export default Dashboard;