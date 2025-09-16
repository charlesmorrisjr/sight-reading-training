import { useNavigate } from 'react-router-dom';
import { FaMusic, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';

export default function LandingPage() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleGuestAccess = async () => {
    await continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>
      
      <div className="max-w-6xl mx-auto text-center">
        {/* App Logo and Title */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <FaMusic className="text-white text-3xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Practisia
          </h1>
        </div>

        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
            Master Sight Reading Through Interactive Practice
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Improve your piano sight reading skills with algorithmically generated exercises, 
            real-time MIDI feedback, and personalized practice sessions. 
            Track your progress and develop fluency with adaptive difficulty levels.
          </p>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-md dark:shadow-gray-900/25">
              <div className="text-blue-500 mb-4 text-2xl">🎹</div>
              <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-3">MIDI Integration</h3>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">Connect your piano for real-time feedback and scoring</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-md dark:shadow-gray-900/25">
              <div className="text-purple-500 mb-4 text-2xl">🎵</div>
              <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-3">Algorithmically Generated Music</h3>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">Endless variety with customizable difficulty and styles</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-md dark:shadow-gray-900/25">
              <div className="text-green-500 mb-4 text-2xl">📊</div>
              <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-3">Progress Tracking</h3>
              <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">Monitor your improvement with detailed analytics</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleLogin}
            className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <FaSignInAlt className="mr-3" />
            Login
          </button>
          
          <button
            onClick={handleSignup}
            className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold border-2 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FaUserPlus className="mr-3" />
            Sign Up
          </button>
          
          <div className="flex items-center mx-4">
            <span className="text-gray-400 dark:text-gray-500 text-sm">or</span>
          </div>
          
          <button
            onClick={handleGuestAccess}
            className="btn btn-ghost btn-lg px-8 py-4 text-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
        
        {/* Footer note */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          Guest access provides full functionality with limited saving capabilities
        </p>
      </div>
    </div>
  );
}