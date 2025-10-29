/**
 * Level Configurations for Flow Mode
 *
 * Each level has predefined settings that progressively increase in difficulty.
 * These serve as the default settings for each level, which users can customize.
 *
 * Difficulty Progression:
 * - Level 1-2: Single hand alternating, C Major only, basic rhythms
 * - Level 3-4: Both hands together, add sharp keys, more patterns
 * - Level 5-6: Flat keys, compound time, sixteenth notes
 * - Level 7-8: Minor keys, complex patterns, wider range
 * - Level 9-10: All keys, all patterns, professional level
 */

export const LEVEL_CONFIGURATIONS = {
  1: {
    // Level metadata
    levelName: "Beginner - Single Notes",
    description: "One hand at a time with simple rhythms in C Major",

    // Musical settings
    key: 'C',
    timeSignature: '4/4',
    measures: 4,
    tempo: 80,

    // Note durations
    noteDurations: ['1/4'],

    // Intervals and patterns
    intervals: [1, 2, 3],
    chordProgressions: ['pop'],

    // Left hand settings
    leftHandPatterns: ['single-notes'],
    leftHandBrokenChords: ['1-3-5-3'],

    // Right hand settings
    rightHandPatterns: ['single-notes'],
    rightHandIntervals: ['2nd'],
    rightHand4NoteChords: ['major'],

    // Hand coordination
    swapHandPatterns: false,
    alternatingHands: true,  // Special mode: only one hand plays at a time

    // Chord/harmony settings
    chordTypes: ['major'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],

    // Melodic settings
    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],

    // Note range constraints
    noteRange: {
      treble: { min: 'C4', max: 'C5' },  // RH: Middle C to C above
      bass: { min: 'C3', max: 'B3' }     // LH: C below middle C to middle C
    },

    // UI settings
    musicScale: 1.0
  },

  2: {
    levelName: "Basic - Half Notes",
    description: "Introduce longer note values, still alternating hands",

    key: 'C',
    timeSignature: '4/4',
    measures: 4,
    tempo: 80,

    noteDurations: ['1/4', '1/2'],  // Add half notes

    intervals: [1, 2, 3],
    chordProgressions: ['pop'],

    leftHandPatterns: ['single-notes'],
    leftHandBrokenChords: ['1-3-5-3'],

    rightHandPatterns: ['single-notes'],
    rightHandIntervals: ['2nd'],
    rightHand4NoteChords: ['major'],

    swapHandPatterns: false,
    alternatingHands: true,  // Still alternating

    chordTypes: ['major'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],

    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],

    noteRange: {
      treble: { min: 'C4', max: 'D5' },  // Expanded by 2 notes each direction
      bass: { min: 'B2', max: 'D4' }
    },

    musicScale: 1.0
  },

  3: {
    levelName: "Basic - Eighth Notes",
    description: "Begin coordinating both hands with simple bass and melody",

    key: 'C',
    timeSignature: '4/4',
    measures: 4,
    tempo: 80,

    noteDurations: ['1/4', '1/2'],

    intervals: [1, 2, 3],  // Unison, 2nds, 3rds
    chordProgressions: ['pop', '50s'],

    leftHandPatterns: ['block-chords'],  // LH plays block chords
    leftHandBrokenChords: ['1-3-5-3'],

    rightHandPatterns: ['single-notes'],  // RH plays melody
    rightHandIntervals: ['2nd'],
    rightHand4NoteChords: ['major'],

    swapHandPatterns: false,
    alternatingHands: false,  // Both hands together now!

    chordTypes: ['major'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],

    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],

    noteRange: {
      treble: { min: 'C4', max: 'E5' },
      bass: { min: 'A2', max: 'E4' }
    },

    musicScale: 1.0
  },

  4: {
    levelName: "Elementary - Two Hands",
    description: "Begin coordinating both hands with simple bass and melody",

    key: 'C',
    timeSignature: '4/4',
    measures: 4,
    tempo: 90,

    noteDurations: ['1/4', '1/2'],

    intervals: [1, 2, 3],  // Unison, 2nds, 3rds
    chordProgressions: ['pop', '50s'],

    leftHandPatterns: ['block-chords'],  // LH plays block chords
    leftHandBrokenChords: ['1-3-5-3'],

    rightHandPatterns: ['single-notes'],  // RH plays melody
    rightHandIntervals: ['2nd'],
    rightHand4NoteChords: ['major'],

    swapHandPatterns: false,
    alternatingHands: false,  // Both hands together now!

    chordTypes: ['major'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],

    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],

    noteRange: {
      treble: { min: 'C4', max: 'E5' },
      bass: { min: 'A2', max: 'E4' }
    },

    musicScale: 1.0
  },

  5: {
    levelName: "Elementary - Eighth Notes",
    description: "Add sharps and flats, practice more complex intervals",

    key: 'C',
    timeSignature: '4/4',
    measures: 6,
    tempo: 80,

    noteDurations: ['1/4', '1/8'],  // Add eighth notes

    intervals: [1, 2, 3, 4],  // Add 4ths
    chordProgressions: ['pop', '50s', 'basic-cadence'],

    leftHandPatterns: ['block-chords'],
    leftHandBrokenChords: ['1-3-5-3', '1-5-3-5'],

    rightHandPatterns: ['single-notes', 'intervals'],  // Add intervals
    rightHandIntervals: ['2nd', '3rd'],
    rightHand4NoteChords: ['major'],

    swapHandPatterns: false,
    alternatingHands: false,

    chordTypes: ['major', 'minor'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],

    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],

    noteRange: {
      treble: { min: 'C4', max: 'F5' },
      bass: { min: 'G2', max: 'F4' }
    },

    musicScale: 1.0
  },

  6: {
    levelName: "Developing - Flat Keys & 3/4",
    description: "Explore flat keys and waltz time signature",

    key: 'F',  // 1 flat
    timeSignature: '3/4',  // Waltz time
    measures: 6,
    tempo: 110,

    noteDurations: ['1/4', '1/8', '1/2'],

    intervals: [1, 2, 3, 4, 5],  // Add 5ths
    chordProgressions: ['pop', '50s', 'basic-cadence', 'pop-variation'],

    leftHandPatterns: ['block-chords', 'broken-chords'],
    leftHandBrokenChords: ['1-3-5-3', '1-5-3-5'],

    rightHandPatterns: ['single-notes', 'intervals'],
    rightHandIntervals: ['2nd', '3rd', '4th'],
    rightHand4NoteChords: ['major'],

    swapHandPatterns: false,
    alternatingHands: false,

    chordTypes: ['major', 'minor'],
    chordInversions: ['root', '1st'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],

    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],

    noteRange: {
      treble: { min: 'C4', max: 'G5' },
      bass: { min: 'F2', max: 'G4' }
    },

    musicScale: 1.0
  },

  7: {
    levelName: "Progressing - Sixteenth Notes",
    description: "Master faster rhythms and multiple time signatures",

    key: 'D',  // 2 sharps
    timeSignature: '4/4',
    measures: 8,
    tempo: 120,

    noteDurations: ['1/16', '1/8', '1/4', '1/2'],  // Add sixteenth notes

    intervals: [1, 2, 3, 4, 5, 6],  // Add 6ths
    chordProgressions: ['pop', '50s', 'basic-cadence', 'pop-variation', 'jazz'],

    leftHandPatterns: ['block-chords', 'broken-chords', 'alberti-bass'],
    leftHandBrokenChords: ['1-3-5-3', '1-5-3-5', '1-5-3-1'],

    rightHandPatterns: ['single-notes', 'intervals', '3-note-chords'],
    rightHandIntervals: ['2nd', '3rd', '4th', '5th'],
    rightHand4NoteChords: ['major', 'minor'],

    swapHandPatterns: false,
    alternatingHands: false,

    chordTypes: ['major', 'minor'],
    chordInversions: ['root', '1st', '2nd'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight', 'syncopated'],

    melodicPatterns: ['melodies', 'scales'],
    melodicArticulations: ['legato', 'staccato'],

    noteRange: {
      treble: { min: 'C4', max: 'A5' },
      bass: { min: 'E2', max: 'A4' }
    },

    musicScale: 1.0
  },

  8: {
    levelName: "Advanced - Minor Keys",
    description: "Practice advanced chord progressions and minor keys",

    key: 'Am',  // Natural minor
    timeSignature: '4/4',
    measures: 8,
    tempo: 120,

    noteDurations: ['1/16', '1/8', '1/4', '1/2', '1'],  // Add whole notes

    intervals: [1, 2, 3, 4, 5, 6, 7],  // Add 7ths
    chordProgressions: ['pop', '50s', 'basic-cadence', 'pop-variation', 'jazz', 'alternating', 'minor-start'],

    leftHandPatterns: ['block-chords', 'broken-chords', 'alberti-bass', 'octaves'],
    leftHandBrokenChords: ['1-3-5-3', '1-5-3-5', '1-5-3-1'],

    rightHandPatterns: ['single-notes', 'intervals', '3-note-chords', 'octaves'],
    rightHandIntervals: ['2nd', '3rd', '4th', '5th', '6th'],
    rightHand4NoteChords: ['major', 'minor', '7th'],

    swapHandPatterns: false,
    alternatingHands: false,

    chordTypes: ['major', 'minor', 'diminished'],
    chordInversions: ['root', '1st', '2nd'],
    chordVoicings: ['closed', 'open'],
    chordRhythms: ['straight', 'syncopated'],

    melodicPatterns: ['melodies', 'scales', 'arpeggios'],
    melodicArticulations: ['legato', 'staccato'],

    noteRange: {
      treble: { min: 'C4', max: 'B5' },
      bass: { min: 'D2', max: 'B4' }
    },

    musicScale: 1.0
  },

  9: {
    levelName: "Proficient - Complex Time",
    description: "Handle compound meters and walking bass patterns",

    key: 'Bb',  // 2 flats
    timeSignature: '6/8',  // Compound meter
    measures: 8,
    tempo: 130,

    noteDurations: ['1/16', '1/8', '1/4', '1/2', '1'],

    intervals: [1, 2, 3, 4, 5, 6, 7, 8],  // Add octaves
    chordProgressions: ['pop', '50s', 'basic-cadence', 'pop-variation', 'jazz', 'alternating', 'minor-start', 'variation'],

    leftHandPatterns: ['block-chords', 'broken-chords', 'alberti-bass', 'octaves', 'walking-bass'],
    leftHandBrokenChords: ['1-3-5-3', '1-5-3-5', '1-5-3-1'],

    rightHandPatterns: ['single-notes', 'intervals', '3-note-chords', 'octaves', '4-note-chords'],
    rightHandIntervals: ['2nd', '3rd', '4th', '5th', '6th', '7th'],
    rightHand4NoteChords: ['major', 'minor', '7th', 'maj7'],

    swapHandPatterns: false,
    alternatingHands: false,

    chordTypes: ['major', 'minor', 'diminished', 'augmented'],
    chordInversions: ['root', '1st', '2nd'],
    chordVoicings: ['closed', 'open'],
    chordRhythms: ['straight', 'syncopated', 'swung'],

    melodicPatterns: ['melodies', 'scales', 'arpeggios'],
    melodicArticulations: ['legato', 'staccato', 'accent'],

    noteRange: {
      treble: { min: 'C4', max: 'C6' },  // Wider range
      bass: { min: 'C2', max: 'C5' }
    },

    musicScale: 1.0
  },

  10: {
    levelName: "Expert - Advanced Keys",
    description: "Navigate chromatic passages and all key signatures",

    key: 'E',  // 4 sharps
    timeSignature: '12/8',
    measures: 12,
    tempo: 140,

    noteDurations: ['1/16', '1/8', '1/4', '1/2', '1'],

    intervals: [1, 2, 3, 4, 5, 6, 7, 8],
    chordProgressions: ['pop', '50s', 'basic-cadence', 'pop-variation', 'jazz', 'alternating', 'minor-start', 'variation'],

    leftHandPatterns: ['block-chords', 'broken-chords', 'alberti-bass', 'octaves', 'walking-bass'],
    leftHandBrokenChords: ['1-3-5-3', '1-5-3-5', '1-5-3-1'],

    rightHandPatterns: ['single-notes', 'intervals', '3-note-chords', 'octaves', '4-note-chords', 'arpeggios'],
    rightHandIntervals: ['2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'],
    rightHand4NoteChords: ['major', 'minor', '7th', 'maj7', 'dim7'],

    swapHandPatterns: true,  // Allow pattern swapping
    alternatingHands: false,

    chordTypes: ['major', 'minor', 'diminished', 'augmented'],
    chordInversions: ['root', '1st', '2nd'],
    chordVoicings: ['closed', 'open'],
    chordRhythms: ['straight', 'syncopated', 'swung'],

    melodicPatterns: ['melodies', 'scales', 'arpeggios'],
    melodicArticulations: ['legato', 'staccato', 'accent'],

    noteRange: {
      treble: { min: 'C4', max: 'E6' },
      bass: { min: 'A1', max: 'D5' }
    },

    musicScale: 1.0
  },
};

/**
 * Helper function to validate level number
 * @param {number} levelNumber - Level number to validate (1-10)
 * @returns {boolean} True if level is valid
 */
export const isValidLevel = (levelNumber) => {
  return Number.isInteger(levelNumber) && levelNumber >= 1 && levelNumber <= 10;
};

/**
 * Get level configuration by level number
 * @param {number} levelNumber - Level number (1-10)
 * @returns {Object|null} Level configuration object or null if invalid
 */
export const getLevelConfiguration = (levelNumber) => {
  if (!isValidLevel(levelNumber)) {
    console.warn(`Invalid level number: ${levelNumber}. Must be between 1 and 10.`);
    return null;
  }
  return LEVEL_CONFIGURATIONS[levelNumber];
};

/**
 * Get all available level numbers
 * @returns {number[]} Array of level numbers [1, 2, 3, ..., 10]
 */
export const getAllLevelNumbers = () => {
  return Object.keys(LEVEL_CONFIGURATIONS).map(Number).sort((a, b) => a - b);
};

/**
 * Get metadata for a level (name and description only)
 * @param {number} levelNumber - Level number (1-10)
 * @returns {Object|null} Object with levelName and description, or null if invalid
 */
export const getLevelMetadata = (levelNumber) => {
  const config = getLevelConfiguration(levelNumber);
  if (!config) return null;

  return {
    levelName: config.levelName,
    description: config.description
  };
};
