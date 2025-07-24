import React from 'react';
import './Dashboard.css';

const Dashboard = ({ settings, onSettingsChange, onNavigate }) => {
  // TODO: settings and onSettingsChange will be used for future database integration
  // Currently these props are prepared for future database integration
  console.debug('Dashboard props:', { settings, onSettingsChange });
  const handleCategoryClick = (categoryId) => {
    console.log(`Category clicked: ${categoryId}`);
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
    if (navItem === 'practice' && onNavigate) {
      onNavigate('practice');
    } else {
      console.log(`Navigation clicked: ${navItem}`);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="app-title">
            <h1>🎹 Sight Reading Trainer</h1>
          </div>
          <button className="settings-btn" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-buttons">
          <button 
            className="nav-btn active"
            onClick={() => handleNavClick('home')}
          >
            🏠 Home
          </button>
          <button 
            className="nav-btn"
            onClick={() => handleNavClick('practice')}
          >
            🎹 Practice
          </button>
          <button 
            className="nav-btn"
            onClick={() => handleNavClick('stats')}
          >
            📊 Stats
          </button>
          <button 
            className="nav-btn"
            onClick={() => handleNavClick('profile')}
          >
            👤 Profile
          </button>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Progress Summary */}
        <section className="progress-summary card">
          <h2>🎯 Progress Summary</h2>
          <div className="progress-content">
            <div className="progress-stat">
              <span className="progress-label">Pattern Mastery:</span>
              <span className="progress-value">68%</span>
            </div>
            <div className="progress-stat">
              <span className="progress-label">Last practiced:</span>
              <span className="progress-value">Aug 20</span>
            </div>
          </div>
        </section>

        {/* Exercise Categories */}
        <section className="exercise-categories card">
          <h2>🎼 Exercise Categories</h2>
          <div className="categories-grid">
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('intervals')}
            >
              🔁 Intervals (Steps, Skips, Leaps)
            </button>
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('chords')}
            >
              🔣 Chord Shapes & Arpeggios
            </button>
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('melodic')}
            >
              🧩 Melodic Patterns (Scales, Sequences)
            </button>
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('clefs')}
            >
              🎼 Bass vs Treble clef challenges
            </button>
          </div>
        </section>

        {/* Suggested Drill */}
        <section className="suggested-drill card">
          <h2>🔥 Suggested Drill</h2>
          <div className="drill-content">
            <div className="drill-info">
              <h3>Interval Drill #7: 3rds and 4ths</h3>
              <div className="drill-meta">
                <span className="drill-time">[ Time: 3 min ]</span>
                <span className="drill-difficulty">[ Difficulty: ★★☆☆☆ ]</span>
              </div>
            </div>
            <button className="drill-play-btn" onClick={handleDrillPlay}>
              ▶
            </button>
          </div>
        </section>

        {/* My Exercises */}
        <section className="my-exercises card">
          <h2>📚 My Exercises</h2>
          <div className="exercises-content">
            <button 
              className="add-drill-btn"
              onClick={handleAddCustomDrill}
            >
              [ + Add Custom Drill ]
            </button>
            <div className="exercises-list">
              <button 
                className="exercise-item"
                onClick={() => handleCustomDrillClick('arpeggios')}
              >
                • 5-note Arpeggios in C Major
              </button>
              <button 
                className="exercise-item"
                onClick={() => handleCustomDrillClick('step-skip')}
              >
                • Step-Skip Mix in Treble Clef
              </button>
              <button 
                className="exercise-item"
                onClick={() => handleCustomDrillClick('grand-staff')}
              >
                • Grand Staff Leap Challenge
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;