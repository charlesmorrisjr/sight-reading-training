import { FaTimes, FaCheck, FaTimes as FaX, FaTrophy, FaStar, FaThumbsUp } from 'react-icons/fa';

const ScoreModal = ({ 
  isOpen, 
  onClose, 
  correctCount, 
  wrongCount, 
  correctNotes = [], 
  wrongNotes = [] 
}) => {
  if (!isOpen) return null;

  const totalNotes = correctCount + wrongCount;
  const percentage = totalNotes > 0 ? Math.round((correctCount / totalNotes) * 100) : 0;

  // Determine message and color based on score
  const getScoreMessage = (score) => {
    if (score >= 90) return { message: "Excellent!", icon: FaTrophy, color: "text-yellow-500" };
    if (score >= 80) return { message: "Great job!", icon: FaStar, color: "text-blue-500" };
    if (score >= 70) return { message: "Good work!", icon: FaThumbsUp, color: "text-green-500" };
    if (score >= 60) return { message: "Keep practicing!", icon: FaThumbsUp, color: "text-orange-500" };
    return { message: "Try again!", icon: FaThumbsUp, color: "text-gray-500" };
  };

  const scoreInfo = getScoreMessage(percentage);
  const ScoreIcon = scoreInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Practice Score</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Score Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-2 ${scoreInfo.color}`}>
            {percentage}%
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <ScoreIcon className={`text-2xl ${scoreInfo.color}`} />
            <div className="text-xl font-semibold text-gray-700">{scoreInfo.message}</div>
          </div>
          <div className="text-gray-600">
            {correctCount} correct out of {totalNotes} notes played
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Correct Notes */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaCheck className="text-green-600" />
              <span className="font-semibold text-green-800">Correct</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
          </div>

          {/* Wrong Notes */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaX className="text-red-600" />
              <span className="font-semibold text-red-800">Incorrect</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
          </div>
        </div>

        {/* Note Details */}
        {(correctNotes.length > 0 || wrongNotes.length > 0) && (
          <div className="space-y-4">
            {/* Correct Notes List */}
            {correctNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <FaCheck className="text-green-600" />
                  Correct Notes:
                </h3>
                <div className="bg-green-50 rounded-lg p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {correctNotes.map((note, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-green-200 text-green-800 rounded font-mono text-sm"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wrong Notes List */}
            {wrongNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <FaX className="text-red-600" />
                  Incorrect Notes:
                </h3>
                <div className="bg-red-50 rounded-lg p-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {wrongNotes.map((note, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-red-200 text-red-800 rounded font-mono text-sm"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="btn btn-primary btn-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;