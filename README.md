# Sight Reading Trainer

A modern web application for piano sight reading practice, built with React and Vite. This interactive training tool generates customizable musical exercises to help pianists improve their sight reading skills.

## ✨ Features

- **Dynamic Music Generation**: Algorithmically generates random musical exercises using ABC notation
- **Customizable Settings**: Configure key signatures, time signatures, intervals, note durations, and chord progressions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices with adaptive music notation layout

## 🛠️ Tech Stack

- **Frontend**: React 19 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized production builds
- **Music Notation**: AbcJS library for rendering ABC notation to SVG
- **Styling**: CSS3 with responsive design principles
- **Code Quality**: ESLint for code linting and consistency

## 🚀 Getting Started

## 📖 Usage

1. Open the application in your browser
2. Click the hamburger menu to access settings
3. Customize your practice session:
   - Select key signature and time signature
   - Choose intervals and note durations
   - Configure chord progressions and hand patterns
4. Click "Generate New Exercise" to create a new sight reading challenge
5. Practice reading the generated musical notation

## 📁 Project Structure

```
src/
├── components/
│   ├── HamburgerMenu.jsx      # Settings menu component
│   ├── MusicDisplay.jsx       # Music notation rendering
│   └── SettingsPanel.jsx      # Configuration panel
├── utils/
│   └── musicGenerator.js      # ABC notation generation logic
├── App.jsx                    # Main application component
└── main.jsx                   # Application entry point
```

## 🔧 Key Technical Implementations

### 🎵 Music Generation Algorithm
- Custom algorithm for generating valid ABC notation
- Supports multiple time signatures (4/4, 3/4, 2/4, 6/8, 12/8, 2/2)
- Configurable chord progressions and hand patterns
- Interval-based melody generation based on the chords in the chord progression

### 📱 Responsive Music Notation
- Dynamic staff width calculation based on viewport
- Adaptive measures per line for different screen sizes
- Optimized spacing for various time signatures

### ⚡ Performance Optimizations
- React hooks for state management and memoization
- Efficient re-rendering with useCallback and useEffect
- Debounced resize handling for responsive layouts

## 🔮 Future Enhancements

- AI generated exercises
- Audio playback integration
- Progress tracking and statistics
- Custom exercise creation
- Exercise library
- MIDI input support
- Performance analysis and feedback

