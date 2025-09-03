import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/database';
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
  }, [user?.id]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header showLogout={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Welcome Section */}
          <div className="hero bg-blue-600 text-white rounded-2xl animate-fade-in">
            <div className="hero-content text-center py-12 px-8">
              <div className="max-w-xl mx-auto">
                <h1 className="text-4xl font-bold mb-4">Welcome back, {user?.name}!</h1>
                <p className="text-blue-100 mb-10">
                  Ready to improve your sight reading skills? Let's continue your musical journey.
                </p>
                
                <button 
                  className="btn btn-white btn-lg px-8 py-4 text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  onClick={() => navigate('/free-practice')}
                >
                  Start Practice
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
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
                    <p className="text-sm font-medium text-gray-600">Exercises Generated</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profileLoading ? '...' : exercisesGenerated}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Categories
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
          */}

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