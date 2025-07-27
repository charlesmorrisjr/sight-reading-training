import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  FaBars
} from 'react-icons/fa';

const Dashboard = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State for intervals selection page
  const [showIntervalsPage, setShowIntervalsPage] = useState(false);
  
  // TODO: settings and onSettingsChange will be used for future database integration
  // Currently these props are prepared for future database integration
  console.debug('Dashboard props:', { settings, onSettingsChange });
  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'intervals') {
      navigate('/intervals');
    } else {
      console.log(`Category clicked: ${categoryId}`);
    }
  };

  const handleDrillPlay = () => {
    console.log('Playing suggested drill');
  };

  const handleAddCustomDrill = () => {
    console.log('Adding custom drill');
  };

  const handleCustomDrillClick = (drillId) => {
    console.log(`Custom drill clicked: ${drillId}`);
  };

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
            <div className="hero-content text-center py-12">
              <div className="max-w-md mx-auto">
                <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                <p className="text-blue-100 mb-6">
                  Ready to improve your sight reading skills? Let's continue your musical journey.
                </p>
                <button 
                  className="btn btn-white btn-lg"
                  onClick={() => handleNavClick('practice')}
                >
                  <FaPlay className="mr-2" />
                  Start Practicing
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
                      <span className="text-2xl">🔁</span>
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
                      <span className="text-2xl">🔣</span>
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
                      <span className="text-2xl">🧩</span>
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
                      <span className="text-2xl">🎼</span>
                    </div>
                    <div>
                      <div className="font-semibold text-base">Clef Challenges</div>
                      <div className="text-sm text-gray-500">Bass vs Treble</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Exercises */}
            <div className="card bg-white shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center">
                  <span className="text-2xl mr-2">📚</span>
                  My Exercises
                </h2>
                <div className="space-y-4">
                  <button 
                    className="btn btn-outline btn-block btn-lg border-dashed hover:bg-blue-50"
                    onClick={handleAddCustomDrill}
                  >
                    <FaPlus className="mr-2" />
                    Add Custom Drill
                  </button>
                  
                  <div className="space-y-2">
                    <button 
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                      onClick={() => handleCustomDrillClick('arpeggios')}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="font-medium">5-note Arpeggios in C Major</span>
                      </div>
                    </button>
                    
                    <button 
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                      onClick={() => handleCustomDrillClick('step-skip')}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="font-medium">Step-Skip Mix in Treble Clef</span>
                      </div>
                    </button>
                    
                    <button 
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                      onClick={() => handleCustomDrillClick('grand-staff')}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <span className="font-medium">Grand Staff Leap Challenge</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Drill */}
            <div className="card bg-white text-gray-900 shadow-lg">
              <div className="card-body flex flex-col h-full">
                <div>
                  <h2 className="card-title text-xl mb-4 flex items-center">
                    <span className="text-2xl mr-2">🔥</span>
                    Suggested Drill
                  </h2>
                  <div>
                    <h3 className="text-lg font-semibold">Interval Drill #7: 3rds and 4ths</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="badge badge-warning">3 min</div>
                      <div className="badge badge-info">★★☆☆☆</div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-6">
                  <button 
                    className="btn btn-outline btn-lg w-full"
                    onClick={handleDrillPlay}
                  >
                    <FaPlay className="mr-2" />
                    Start Drill
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;