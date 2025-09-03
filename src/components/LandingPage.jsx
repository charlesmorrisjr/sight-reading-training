import { useNavigate } from 'react-router-dom';
import { FaMusic, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* App Logo and Title */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <FaMusic className="text-white text-3xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Practisia
          </h1>
        </div>

        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
            Master Sight Reading Through Interactive Practice
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Improve your piano sight reading skills with algorithmically generated exercises, 
            real-time MIDI feedback, and personalized practice sessions. 
            Track your progress and develop fluency with adaptive difficulty levels.
          </p>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <div className="text-blue-500 mb-3">🎹</div>
              <h3 className="font-semibold text-gray-800 mb-2">MIDI Integration</h3>
              <p className="text-sm text-gray-600">Connect your piano for real-time feedback and scoring</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <div className="text-purple-500 mb-3">🎵</div>
              <h3 className="font-semibold text-gray-800 mb-2">Algorithmically Generated Music</h3>
              <p className="text-sm text-gray-600">Endless variety with customizable difficulty and styles</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <div className="text-green-500 mb-3">📊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600">Monitor your improvement with detailed analytics</p>
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
            <span className="text-gray-400 text-sm">or</span>
          </div>
          
          <button
            onClick={handleGuestAccess}
            className="btn btn-ghost btn-lg px-8 py-4 text-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
        
        {/* Footer note */}
        <p className="text-sm text-gray-500 mt-8">
          Guest access provides full functionality with limited saving capabilities
        </p>
      </div>
    </div>
  );
}