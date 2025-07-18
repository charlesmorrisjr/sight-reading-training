/**
 * Music Generator Utility for Sight Reading Training
 * Generates random ABC notation for piano sight reading practice
 */

/**
 * Generates a random ABC notation string for sight reading practice
 * @param {Object} options - Configuration options
 * @param {number} options.measures - Number of measures to generate (1-32)
 * @param {string} options.key - Musical key (e.g., 'C', 'G', 'D', 'Am', 'Em')
 * @param {string} options.timeSignature - Time signature (e.g., '4/4', '3/4', '2/4', '6/8', '12/8', '2/2')
 * @param {number[]} options.intervals - Available intervals (1-8)
 * @param {string[]} options.noteDurations - Available note durations ('1/16', '1/8', '1/4', '1/2', '1')
 * @param {string[]} options.chordProgressions - Selected chord progression IDs
 * @param {string[]} options.leftHandPatterns - Selected left hand pattern IDs
 * @param {string[]} options.rightHandPatterns - Selected right hand pattern IDs
 * @param {string[]} options.rightHandIntervals - Selected right hand interval types ('2nd', '3rd', etc.)
 * @param {string[]} options.rightHand4NoteChords - Selected right hand 4-note chord types ('major', '7th')
 * @returns {string} ABC notation string
 */
export function generateRandomABC(options) {
  const {
    measures = 8,
    key = 'C',
    timeSignature = '4/4',
    intervals = [1, 2, 3, 4, 5],
    noteDurations = ['1/8', '1/4'],
    chordProgressions = null,
    leftHandPatterns = ['block-chords'],
    rightHandPatterns = ['single-notes'],
    rightHandIntervals = ['2nd'],
    rightHand4NoteChords = ['major']
  } = options;

  // Parse time signature
  const [beatsPerMeasure, beatUnit] = timeSignature.split('/').map(Number);
  const totalBeatsPerMeasure = beatsPerMeasure * (8 / beatUnit); // Convert to eighth note units

  // Basic ABC header
  let abc = `X:1\nT:\nM:${timeSignature}\nL:1/8\nK:${key}\n`;
  abc += "V:1 clef=treble\nV:2 clef=bass\n";
  
  // Available notes based on chromatic scale
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  // Convert note durations to eighth note units
  const durationMap = {
    '1/16': 0.5,
    '1/8': 1,
    '1/4': 2,
    '1/2': 4,
    '1': 8
  };

  const availableDurations = noteDurations.map(duration => ({
    duration,
    beats: durationMap[duration],
    abcNotation: duration === '1/8' ? '' : duration === '1/4' ? '2' : 
                 duration === '1/2' ? '4' : duration === '1' ? '8' : '/2'
  }));

  /**
   * Helper to generate a single measure for a clef
   */
  function generateMeasure(startIndex, lowestIndex, octaveOffset = 0, highestIndex = null, maxOctavesLower = null, chordNotes = null) {
    let lastNoteIndex = startIndex;
    let octaveLower = false;
    let measure = '';
    let beatsUsed = 0; // Start with zero beats

    // Get harmonic note indices if chord is provided
    const harmonicIndices = chordNotes ? getHarmonicNoteIndices(chordNotes, key) : null;

    // Fill measure with random notes
    while (beatsUsed < totalBeatsPerMeasure) {
      let candidateIndex;
      let interval = 0;
      
      // 70% chance to use harmonic note, 30% chance to use interval-based movement
      if (harmonicIndices && Math.random() < 0.7) {
        // Select from harmonic indices
        const harmonicIndex = harmonicIndices[Math.floor(Math.random() * harmonicIndices.length)];
        candidateIndex = harmonicIndex;
      } else {
        // Use interval-based movement
        interval = intervals[Math.floor(Math.random() * intervals.length)] - 1;
        // Randomly change interval to negative so notes can go downward
        interval = Math.random() < 0.5 ? -interval : interval;
        candidateIndex = lastNoteIndex + interval;
      }
      
      // Clamp to bounds
      if (highestIndex !== null && candidateIndex > highestIndex) {
        candidateIndex = lastNoteIndex - Math.abs(interval || 1);
      }
      if (candidateIndex < lowestIndex) {
        candidateIndex = lastNoteIndex + Math.abs(interval || 1);
      }
      lastNoteIndex = candidateIndex;

      // Determine octave placement
      let nextNoteIndex = lastNoteIndex;
      if (nextNoteIndex < 0) {
        octaveLower = true;
      }

      // Set next note (use modulo to wrap around the notes array)
      let nextNote = notes[((lastNoteIndex % 7) + 7) % 7];
      
      // Apply octave modifications
      if (octaveLower) {
        let numOctavesLower = Math.abs(Math.floor((nextNoteIndex + octaveOffset) / 7));
        if (maxOctavesLower !== null) {
          numOctavesLower = Math.min(numOctavesLower, maxOctavesLower);
        }
        nextNote = nextNote + ",".repeat(numOctavesLower);
        octaveLower = false;
      } else if (nextNoteIndex + octaveOffset >= 7) {
        nextNote = nextNote.toLowerCase();
      }

      // Select random duration that fits in remaining beats
      const remainingBeats = totalBeatsPerMeasure - beatsUsed;
      const validDurations = availableDurations.filter(d => d.beats <= remainingBeats);
      
      if (validDurations.length === 0) {
        // If no valid durations fit, try to use the shortest available duration
        // that can fit in the remaining space, even if it means extending the measure slightly
        const shortestDuration = availableDurations.reduce((shortest, current) => 
          current.beats < shortest.beats ? current : shortest
        );
        
        // Use the shortest available duration
        measure += nextNote + shortestDuration.abcNotation;
        beatsUsed += shortestDuration.beats;
        break;
      }

      const selectedDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
      
      // Add note with duration to measure
      measure += nextNote + selectedDuration.abcNotation;
      beatsUsed += selectedDuration.beats;

      // Add space after certain note types for readability
      if (selectedDuration.abcNotation && beatsUsed < totalBeatsPerMeasure) {
        measure += ' ';
      }
    }
    
    return measure + '|';
  }

  // Generate chord progression for the piece
  const chordProgression = generateChordProgression(measures, key, chordProgressions);
  
  // Generate measures for both clefs
  let trebleMeasures = [];
  let bassMeasures = [];
  
  for (let i = 0; i < measures; i++) {
    const currentChord = chordProgression[i];
    
    // Treble: generate pattern based on selected right hand patterns
    const selectedRightHandPattern = rightHandPatterns && rightHandPatterns.length > 0 ? rightHandPatterns[0] : 'single-notes';
    
    if (selectedRightHandPattern === 'octaves') {
      trebleMeasures.push(generateRightHandOctaves(0, -3, 0, null, null, currentChord, totalBeatsPerMeasure, intervals, availableDurations, key));
    } else if (selectedRightHandPattern === 'intervals') {
      const selectedInterval = rightHandIntervals && rightHandIntervals.length > 0 ? rightHandIntervals[0] : '2nd';
      trebleMeasures.push(generateRightHandIntervals(0, -3, 0, null, null, currentChord, totalBeatsPerMeasure, intervals, availableDurations, key, selectedInterval));
    } else if (selectedRightHandPattern === '3-note-chords') {
      trebleMeasures.push(generateRightHand3NoteChords(0, -3, 0, null, null, currentChord, totalBeatsPerMeasure, intervals, availableDurations));
    } else if (selectedRightHandPattern === '4-note-chords') {
      const selectedChordType = rightHand4NoteChords && rightHand4NoteChords.length > 0 ? rightHand4NoteChords[0] : 'major';
      trebleMeasures.push(generateRightHand4NoteChords(0, -3, 0, null, null, currentChord, totalBeatsPerMeasure, intervals, availableDurations, key, selectedChordType));
    } else {
      // Default to single notes for all other patterns (including single-notes)
      trebleMeasures.push(generateMeasure(0, -3, 0, null, null, currentChord));
    }
    
    // Bass: generate pattern based on selected left hand patterns
    const selectedLeftHandPattern = leftHandPatterns && leftHandPatterns.length > 0 ? leftHandPatterns[0] : 'block-chords';
    
    if (selectedLeftHandPattern === 'alberti-bass') {
      bassMeasures.push(generateAlbertiBass(currentChord, totalBeatsPerMeasure));
    } else if (selectedLeftHandPattern === 'octaves') {
      bassMeasures.push(generateLeftHandOctaves(currentChord, totalBeatsPerMeasure));
    } else if (selectedLeftHandPattern === 'walking-bass') {
      // Placeholder implementation - will be replaced with actual walking bass logic later
      bassMeasures.push(generateBassChord(currentChord, totalBeatsPerMeasure));
    } else if (selectedLeftHandPattern === 'broken-chords') {
      // Placeholder implementation - will be replaced with actual broken chords logic later
      bassMeasures.push(generateBassChord(currentChord, totalBeatsPerMeasure));
    } else {
      bassMeasures.push(generateBassChord(currentChord, totalBeatsPerMeasure));
    }
  }

  // Build ABC with both voices interleaved
  for (let i = 0; i < measures; i++) {
    abc += `V:1\n${trebleMeasures[i]}\n`;
    abc += `V:2\n${bassMeasures[i]}\n`;
  }

  // Log the ABC notation to the console for debugging
  console.log(abc);

  return abc;
}

/**
 * Get available keys for practice
 */
export const AVAILABLE_KEYS = [
  // Major keys
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  // Minor keys
  'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'
];

/**
 * Get available time signatures
 */
export const AVAILABLE_TIME_SIGNATURES = [
  '4/4', '3/4', '2/4', '6/8', '12/8', '2/2'
];

/**
 * Get available note durations
 */
export const AVAILABLE_NOTE_DURATIONS = [
  { value: '1/16', label: '16th notes' },
  { value: '1/8', label: '8th notes' },
  { value: '1/4', label: 'Quarter notes' },
  { value: '1/2', label: 'Half notes' },
  { value: '1', label: 'Whole notes' }
];

/**
 * Get available intervals
 */
export const AVAILABLE_INTERVALS = [
  { value: 1, label: 'Unison' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
  { value: 6, label: '6th' },
  { value: 7, label: '7th' },
  { value: 8, label: '8th' }
];

/**
 * Chord progression definitions with user-friendly labels
 */
export const CHORD_PROGRESSIONS = [
  {
    id: 'pop',
    label: 'I-V-vi-IV (Pop)',
    progression: ['I', 'V', 'vi', 'IV']
  },
  {
    id: '50s',
    label: 'I-vi-IV-V (50s)',
    progression: ['I', 'vi', 'IV', 'V']
  },
  {
    id: 'pop-variation',
    label: 'vi-IV-I-V (Pop Variation)',
    progression: ['vi', 'IV', 'I', 'V']
  },
  {
    id: 'basic-cadence',
    label: 'I-IV-V-I (Basic Cadence)',
    progression: ['I', 'IV', 'V', 'I']
  },
  {
    id: 'jazz',
    label: 'ii-V-I-vi (Jazz)',
    progression: ['ii', 'V', 'I', 'vi']
  },
  {
    id: 'alternating',
    label: 'I-V-I-V (Alternating)',
    progression: ['I', 'V', 'I', 'V']
  },
  {
    id: 'minor-start',
    label: 'vi-V-IV-V (Minor Start)',
    progression: ['vi', 'V', 'IV', 'V']
  },
  {
    id: 'variation',
    label: 'I-iii-vi-IV (Variation)',
    progression: ['I', 'iii', 'vi', 'IV']
  }
];

/**
 * Available left hand patterns
 */
export const AVAILABLE_LEFT_HAND_PATTERNS = [
  {
    id: 'block-chords',
    label: 'Block Chords',
    description: 'Whole note chords in the bass',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: 'alberti-bass',
    label: 'Alberti Bass',
    description: 'Broken chord pattern (root-fifth-third-fifth)',
    supportedTimeSignatures: ['4/4', '3/4']
  },
  {
    id: 'octaves',
    label: 'Octaves',
    description: 'Root note with octave higher',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: 'walking-bass',
    label: 'Walking Bass',
    description: 'Quarter note bass line walking through chord changes',
    supportedTimeSignatures: ['4/4']
  },
  {
    id: 'broken-chords',
    label: 'Broken Chords',
    description: 'Arpeggiated chord patterns with various sequences',
    supportedTimeSignatures: ['4/4', '3/4']
  }
];

/**
 * Available right hand patterns
 */
export const AVAILABLE_RIGHT_HAND_PATTERNS = [
  {
    id: 'single-notes',
    label: 'Single Notes',
    description: 'Single note melody line',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: 'intervals',
    label: 'Intervals',
    description: 'Two-note intervals',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: '3-note-chords',
    label: '3 Note Chords',
    description: 'Three-note chord voicings',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: '4-note-chords',
    label: '4 Note Chords',
    description: 'Four-note chord voicings',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: 'arpeggios',
    label: 'Arpeggios',
    description: 'Broken chord patterns',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  },
  {
    id: 'octaves',
    label: 'Octaves',
    description: 'Melody notes with octave higher',
    supportedTimeSignatures: ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2']
  }
];

/**
 * Scale degree to note mapping for major keys
 */
const MAJOR_SCALE_DEGREES = {
  'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'D#': ['D#', 'E#', 'F##', 'G#', 'A#', 'B#', 'C##'],
  'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'G#': ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F##'],
  'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'A#': ['A#', 'B#', 'C##', 'D#', 'E#', 'F##', 'G##'],
  'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
};

/**
 * Scale degree to note mapping for minor keys (natural minor)
 */
const MINOR_SCALE_DEGREES = {
  'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  'A#m': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
  'Bm': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
  'Cm': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  'C#m': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
  'Dm': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
  'D#m': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
  'Em': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
  'Fm': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
  'F#m': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
  'Gm': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
  'G#m': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#']
};

/**
 * Convert Roman numeral chord to chord notes
 * @param {string} romanNumeral - Roman numeral chord (e.g., 'I', 'vi', 'V')
 * @param {string} key - Musical key
 * @returns {string[]} Array of chord notes
 */
function getRomanNumeralChord(romanNumeral, key) {
  const isMinorKey = key.includes('m');
  const scaleDegrees = isMinorKey ? MINOR_SCALE_DEGREES[key] : MAJOR_SCALE_DEGREES[key];
  
  if (!scaleDegrees) {
    console.warn(`Unknown key: ${key}`);
    return ['C', 'E', 'G']; // Default C major chord
  }

  // Parse Roman numeral
  const degree = romanNumeral.toLowerCase();
  
  let rootIndex;
  switch (degree) {
    case 'i': rootIndex = 0; break;
    case 'ii': rootIndex = 1; break;
    case 'iii': rootIndex = 2; break;
    case 'iv': rootIndex = 3; break;
    case 'v': rootIndex = 4; break;
    case 'vi': rootIndex = 5; break;
    case 'vii': rootIndex = 6; break;
    default: rootIndex = 0;
  }

  const root = scaleDegrees[rootIndex];
  const third = scaleDegrees[(rootIndex + 2) % 7];
  const fifth = scaleDegrees[(rootIndex + 4) % 7];

  // For minor keys, adjust chord qualities
  if (isMinorKey) {
    // Natural minor chord qualities: i, ii°, III, iv, v, VI, VII
    const minorChordQualities = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
    const quality = minorChordQualities[rootIndex];
    
    if (quality === 'diminished') {
      // For diminished chords, flatten the fifth
      const flatFifth = scaleDegrees[(rootIndex + 4) % 7]; // This is simplified
      return [root, third, flatFifth];
    }
  } else {
    // Major key chord qualities: I, ii, iii, IV, V, vi, vii°
    const majorChordQualities = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
    const quality = majorChordQualities[rootIndex];
    
    if (quality === 'diminished') {
      return [root, third, fifth]; // Simplified for now
    }
  }

  return [root, third, fifth];
}

/**
 * Generate a chord progression based on user selection
 * @param {number} numMeasures - Number of measures
 * @param {string} key - Musical key
 * @param {string[]} selectedProgressions - Array of selected progression IDs
 * @returns {string[][]} Array of chord progressions, each containing note arrays
 */
function generateChordProgression(numMeasures, key, selectedProgressions = null) {
  // If no progressions selected, use all available progressions
  const availableProgressions = selectedProgressions && selectedProgressions.length > 0
    ? CHORD_PROGRESSIONS.filter(prog => selectedProgressions.includes(prog.id))
    : CHORD_PROGRESSIONS;
  
  const selectedProgression = availableProgressions[Math.floor(Math.random() * availableProgressions.length)];
  const progression = selectedProgression.progression;
  const chords = [];
  
  for (let i = 0; i < numMeasures; i++) {
    const romanNumeral = progression[i % progression.length];
    const chordNotes = getRomanNumeralChord(romanNumeral, key);
    chords.push(chordNotes);
  }
  
  return chords;
}

/**
 * Get harmonically appropriate note indices based on chord
 * @param {string[]} chordNotes - Current chord notes (e.g., ['C', 'E', 'G'])
 * @param {string} key - Musical key
 * @returns {number[]} Array of note indices that work with the chord
 */
function getHarmonicNoteIndices(chordNotes, key) {
  if (!chordNotes) return [0, 1, 2, 3, 4, 5, 6]; // Default to all scale degrees
  
  const isMinorKey = key.includes('m');
  const scaleDegrees = isMinorKey ? MINOR_SCALE_DEGREES[key] : MAJOR_SCALE_DEGREES[key];
  
  if (!scaleDegrees) return [0, 1, 2, 3, 4, 5, 6];
  
  const harmonicIndices = [];
  
  // Add chord tones (higher weight by including multiple times)
  chordNotes.forEach(chordNote => {
    const index = scaleDegrees.findIndex(note => note.replace(/[#b]/g, '') === chordNote.replace(/[#b]/g, ''));
    if (index !== -1) {
      // Add chord tones multiple times to increase probability
      harmonicIndices.push(index, index, index);
    }
  });
  
  // Add scale tones (passing notes) with lower weight
  for (let i = 0; i < 7; i++) {
    harmonicIndices.push(i);
  }
  
  return harmonicIndices;
}

/**
 * Convert note name to ABC notation for bass clef
 * @param {string} noteName - Note name (e.g., 'C', 'F#', 'Bb')
 * @returns {string} ABC notation for bass clef
 */
function convertNoteToABC(noteName) {
  // Remove sharp and flat notation because they are not needed and
  // will cause issues with how the notes are displayed in the sheet music
  let abcNote = noteName.replace('#', '').replace('b', '');
  
  // For bass clef, we want notes in the lower octaves
  // Default bass range is around C2-C4, so we'll add commas for lower octaves
  if (abcNote.length === 1) {
    // Single letter notes need to be lowercase for higher octave or add commas for lower
    abcNote = abcNote + ','; // One comma for one octave lower (bass range)
  } else if (abcNote.length === 2) {
    // Notes with accidentals
    abcNote = abcNote + ',';
  }
  
  return abcNote;
}

/**
 * Generate a bass chord measure
 * @param {string[]} chordNotes - Array of chord note names
 * @param {number} totalBeats - Total beats in the measure
 * @returns {string} ABC notation for bass chord measure
 */
function generateBassChord(chordNotes, totalBeats) {
  // Convert chord notes to ABC notation
  const abcChordNotes = chordNotes.map(convertNoteToABC);
  
  // Create a block chord (notes played simultaneously)
  // For a whole note in 4/4 time (8 eighth note beats), we use 8
  const durationNotation = totalBeats.toString();
  
  // Create block chord notation [notes]duration
  const blockChord = `[${abcChordNotes.join('')}]${durationNotation}`;
  
  return blockChord + '|';
}

/**
 * Generate an Alberti bass measure (root-fifth-third-fifth pattern)
 * @param {string[]} chordNotes - Array of chord note names
 * @param {number} totalBeats - Total beats in the measure
 * @returns {string} ABC notation for Alberti bass measure
 */
function generateAlbertiBass(chordNotes, totalBeats) {
  if (chordNotes.length < 3) {
    // Fallback to block chord if not enough notes
    return generateBassChord(chordNotes, totalBeats);
  }
  
  // Extract chord tones: root, third, fifth
  const root = convertNoteToABC(chordNotes[0]);
  const third = convertNoteToABC(chordNotes[1]);
  const fifth = convertNoteToABC(chordNotes[2]);
  
  // Alberti pattern: root-fifth-third-fifth
  const pattern = [root, fifth, third, fifth];
  
  let measure = '';
  let beatsUsed = 0;
  
  // Fill measure with Alberti pattern (eighth notes - traditional Alberti bass)
  while (beatsUsed < totalBeats) {
    const patternIndex = beatsUsed % pattern.length;
    measure += pattern[patternIndex]; // No duration notation = eighth notes (default)
    beatsUsed += 1; // Each note is an eighth note (1 beat in our system)
  }
  
  return measure + '|';
}

/**
 * Generate a left-hand octaves measure (root note with octave higher)
 * @param {string[]} chordNotes - Array of chord note names
 * @param {number} totalBeats - Total beats in the measure
 * @returns {string} ABC notation for left-hand octaves measure
 */
function generateLeftHandOctaves(chordNotes, totalBeats) {
  if (chordNotes.length === 0) {
    return generateBassChord(['C', 'E', 'G'], totalBeats);
  }
  
  const root = convertNoteToABC(chordNotes[0]);
  const rootOctaveHigher = root.replace(/,/g, '');
  
  const durationNotation = totalBeats.toString();
  
  const octaveInterval = `[${root}${rootOctaveHigher}]${durationNotation}`;
  
  return octaveInterval + '|';
}

/**
 * Convert note index and octave information to proper ABC notation
 * @param {number} noteIndex - Index in the scale (0-6, can be negative or > 6)
 * @param {number} octaveOffset - Base octave offset
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @returns {string} ABC notation for the note
 */
function convertNoteIndexToABC(noteIndex, octaveOffset, maxOctavesLower) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  let octaveLower = false;
  
  if (noteIndex < 0) {
    octaveLower = true;
  }
  
  let note = notes[((noteIndex % 7) + 7) % 7];
  
  if (octaveLower) {
    let numOctavesLower = Math.abs(Math.floor((noteIndex + octaveOffset) / 7));
    if (maxOctavesLower !== null) {
      numOctavesLower = Math.min(numOctavesLower, maxOctavesLower);
    }
    note = note + ",".repeat(numOctavesLower);
  } else if (noteIndex + octaveOffset >= 7) {
    note = note.toLowerCase();
    const octavesHigher = Math.floor((noteIndex + octaveOffset) / 7);
    if (octavesHigher > 1) {
      note = note + "'".repeat(octavesHigher - 1);
    }
  }
  
  return note;
}

/**
 * Calculate the note at a given interval above a root note
 * @param {string} rootNote - Root note name (e.g., 'C', 'E', 'G')
 * @param {string} intervalType - Interval type ('2nd', '3rd', '4th', '5th', '6th', '7th')
 * @param {string} key - Musical key for scale context
 * @returns {string} The interval note name
 */

/**
 * Generate a right-hand intervals measure (melody notes with selected interval above)
 * @param {number} startIndex - Starting note index
 * @param {number} lowestIndex - Lowest allowed note index
 * @param {number} octaveOffset - Octave offset for note positioning
 * @param {number} highestIndex - Highest allowed note index
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @param {string[]} chordNotes - Current chord notes for harmonic context
 * @param {number} totalBeatsPerMeasure - Total beats in the measure
 * @param {number[]} intervals - Available intervals for movement
 * @param {object[]} availableDurations - Available note durations
 * @param {string} key - Musical key for harmonic context
 * @param {string} selectedInterval - Selected interval type ('2nd', '3rd', '4th', '5th', '6th', '7th')
 * @returns {string} ABC notation for right-hand intervals measure
 */
function generateRightHandIntervals(startIndex, lowestIndex, octaveOffset, highestIndex, maxOctavesLower, chordNotes, totalBeatsPerMeasure, intervals, availableDurations, key, selectedInterval) {
  let lastNoteIndex = startIndex;
  let measure = '';
  let beatsUsed = 0;
  
  const harmonicIndices = chordNotes ? getHarmonicNoteIndices(chordNotes, key) : null;
  
  while (beatsUsed < totalBeatsPerMeasure) {
    let candidateIndex;
    let interval = 0;
    
    if (harmonicIndices && Math.random() < 0.7) {
      const harmonicIndex = harmonicIndices[Math.floor(Math.random() * harmonicIndices.length)];
      candidateIndex = harmonicIndex;
    } else {
      interval = intervals[Math.floor(Math.random() * intervals.length)] - 1;
      interval = Math.random() < 0.5 ? -interval : interval;
      candidateIndex = lastNoteIndex + interval;
    }
    
    if (highestIndex !== null && candidateIndex > highestIndex) {
      candidateIndex = lastNoteIndex - Math.abs(interval || 1);
    }
    if (candidateIndex < lowestIndex) {
      candidateIndex = lastNoteIndex + Math.abs(interval || 1);
    }
    lastNoteIndex = candidateIndex;
    
    // Calculate root note with proper octave handling
    const rootNote = convertNoteIndexToABC(lastNoteIndex, octaveOffset, maxOctavesLower);
    
    // Calculate interval note index
    const intervalSteps = {
      '2nd': 1,
      '3rd': 2,
      '4th': 3,
      '5th': 4,
      '6th': 5,
      '7th': 6
    };
    
    const steps = intervalSteps[selectedInterval] || 2; // Default to 3rd if unknown
    const intervalNoteIndex = lastNoteIndex + steps;
    
    // Calculate interval note with proper octave handling
    const intervalNote = convertNoteIndexToABC(intervalNoteIndex, octaveOffset, maxOctavesLower);
    
    const remainingBeats = totalBeatsPerMeasure - beatsUsed;
    const validDurations = availableDurations.filter(d => d.beats <= remainingBeats);
    
    if (validDurations.length === 0) {
      const shortestDuration = availableDurations.reduce((shortest, current) => 
        current.beats < shortest.beats ? current : shortest
      );
      
      measure += `[${rootNote}${intervalNote}]${shortestDuration.abcNotation}`;
      beatsUsed += shortestDuration.beats;
      break;
    }
    
    const selectedDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
    
    measure += `[${rootNote}${intervalNote}]${selectedDuration.abcNotation}`;
    beatsUsed += selectedDuration.beats;
    
    if (selectedDuration.abcNotation && beatsUsed < totalBeatsPerMeasure) {
      measure += ' ';
    }
  }
  
  return measure + '|';
}

/**
 * Generate a right-hand octaves measure (melody notes with octave higher)
 * @param {number} startIndex - Starting note index
 * @param {number} lowestIndex - Lowest allowed note index
 * @param {number} octaveOffset - Octave offset for note positioning
 * @param {number} highestIndex - Highest allowed note index
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @param {string[]} chordNotes - Current chord notes for harmonic context
 * @param {number} totalBeatsPerMeasure - Total beats in the measure
 * @param {number[]} intervals - Available intervals for movement
 * @param {object[]} availableDurations - Available note durations
 * @param {string} key - Musical key for harmonic context
 * @returns {string} ABC notation for right-hand octaves measure
 */
function generateRightHandOctaves(startIndex, lowestIndex, octaveOffset, highestIndex, maxOctavesLower, chordNotes, totalBeatsPerMeasure, intervals, availableDurations, key) {
  let lastNoteIndex = startIndex;
  let octaveLower = false;
  let measure = '';
  let beatsUsed = 0;
  
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const harmonicIndices = chordNotes ? getHarmonicNoteIndices(chordNotes, key) : null;
  
  while (beatsUsed < totalBeatsPerMeasure) {
    let candidateIndex;
    let interval = 0;
    
    if (harmonicIndices && Math.random() < 0.7) {
      const harmonicIndex = harmonicIndices[Math.floor(Math.random() * harmonicIndices.length)];
      candidateIndex = harmonicIndex;
    } else {
      interval = intervals[Math.floor(Math.random() * intervals.length)] - 1;
      interval = Math.random() < 0.5 ? -interval : interval;
      candidateIndex = lastNoteIndex + interval;
    }
    
    if (highestIndex !== null && candidateIndex > highestIndex) {
      candidateIndex = lastNoteIndex - Math.abs(interval || 1);
    }
    if (candidateIndex < lowestIndex) {
      candidateIndex = lastNoteIndex + Math.abs(interval || 1);
    }
    lastNoteIndex = candidateIndex;
    
    let nextNoteIndex = lastNoteIndex;
    if (nextNoteIndex < 0) {
      octaveLower = true;
    }
    
    let nextNote = notes[((lastNoteIndex % 7) + 7) % 7];
    
    if (octaveLower) {
      let numOctavesLower = Math.abs(Math.floor((nextNoteIndex + octaveOffset) / 7));
      if (maxOctavesLower !== null) {
        numOctavesLower = Math.min(numOctavesLower, maxOctavesLower);
      }
      nextNote = nextNote + ",".repeat(numOctavesLower);
      octaveLower = false;
    } else if (nextNoteIndex + octaveOffset >= 7) {
      nextNote = nextNote.toLowerCase();
    }
    
    let octaveNote;
    if (nextNote.includes(',')) {
      // Remove one comma for octave higher
      octaveNote = nextNote.replace(/,$/, '');
    } else if (nextNote === nextNote.toUpperCase()) {
      // Uppercase to lowercase for octave higher
      octaveNote = nextNote.toLowerCase();
    } else {
      // Lowercase note gets apostrophe for octave higher
      octaveNote = nextNote + "'";
    }
    
    const remainingBeats = totalBeatsPerMeasure - beatsUsed;
    const validDurations = availableDurations.filter(d => d.beats <= remainingBeats);
    
    if (validDurations.length === 0) {
      const shortestDuration = availableDurations.reduce((shortest, current) => 
        current.beats < shortest.beats ? current : shortest
      );
      
      measure += `[${nextNote}${octaveNote}]${shortestDuration.abcNotation}`;
      beatsUsed += shortestDuration.beats;
      break;
    }
    
    const selectedDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
    
    measure += `[${nextNote}${octaveNote}]${selectedDuration.abcNotation}`;
    beatsUsed += selectedDuration.beats;
    
    if (selectedDuration.abcNotation && beatsUsed < totalBeatsPerMeasure) {
      measure += ' ';
    }
  }
  
  return measure + '|';
}

/**
 * Generate a right-hand 3-note chord measure
 * @param {number} startIndex - Starting note index
 * @param {number} lowestIndex - Lowest allowed note index
 * @param {number} octaveOffset - Octave offset for note positioning
 * @param {number} highestIndex - Highest allowed note index
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @param {string[]} chordNotes - Current chord notes for harmonic context
 * @param {number} totalBeatsPerMeasure - Total beats in the measure
 * @param {number[]} intervals - Available intervals for movement
 * @param {object[]} availableDurations - Available note durations
 * @returns {string} ABC notation for right-hand 3-note chord measure
 */
function generateRightHand3NoteChords(startIndex, lowestIndex, octaveOffset, highestIndex, maxOctavesLower, chordNotes, totalBeatsPerMeasure, intervals, availableDurations) {
  let measure = '';
  let beatsUsed = 0;
  
  // If no chord notes provided, use default C major chord
  const currentChordNotes = chordNotes || ['C', 'E', 'G'];
  
  while (beatsUsed < totalBeatsPerMeasure) {
    // Generate a 3-note chord using chord tones
    const chordVoicing = generate3NoteChordVoicing(currentChordNotes, octaveOffset, maxOctavesLower);
    
    // Select duration that fits in remaining beats
    const remainingBeats = totalBeatsPerMeasure - beatsUsed;
    const validDurations = availableDurations.filter(d => d.beats <= remainingBeats);
    
    if (validDurations.length === 0) {
      const shortestDuration = availableDurations.reduce((shortest, current) => 
        current.beats < shortest.beats ? current : shortest
      );
      
      measure += `[${chordVoicing.join('')}]${shortestDuration.abcNotation}`;
      beatsUsed += shortestDuration.beats;
      break;
    }
    
    const selectedDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
    
    // Add 3-note chord to measure
    measure += `[${chordVoicing.join('')}]${selectedDuration.abcNotation}`;
    beatsUsed += selectedDuration.beats;
    
    // Add space after chord if not at end of measure
    if (selectedDuration.abcNotation && beatsUsed < totalBeatsPerMeasure) {
      measure += ' ';
    }
  }
  
  return measure + '|';
}

/**
 * Generate a 3-note chord voicing using chord tones with varied inversions and octaves
 * @param {string[]} chordNotes - Current chord notes (root, third, fifth)
 * @param {number} octaveOffset - Octave offset for note positioning
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @returns {string[]} Array of ABC notation strings for the 3 chord notes
 */
function generate3NoteChordVoicing(chordNotes, octaveOffset, maxOctavesLower) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  if (chordNotes.length < 3) {
    // Fallback to default C major chord if not enough notes
    chordNotes = ['C', 'E', 'G'];
  }
  
  // Extract chord tones
  const root = chordNotes[0];
  const third = chordNotes[1];
  const fifth = chordNotes[2];
  
  // Convert chord note names to note indices
  const rootIndex = notes.findIndex(note => note === root.replace(/[#b]/g, ''));
  const thirdIndex = notes.findIndex(note => note === third.replace(/[#b]/g, ''));
  const fifthIndex = notes.findIndex(note => note === fifth.replace(/[#b]/g, ''));
  
  // Create chord voicings where each note is only a 3rd or 4th apart from the next
  // Start with different chord orderings (inversions)
  const chordOrderings = [
    [rootIndex, thirdIndex, fifthIndex],  // Root position
    [thirdIndex, fifthIndex, rootIndex],  // First inversion
    [fifthIndex, rootIndex, thirdIndex],  // Second inversion
  ];
  
  // Randomly select a chord ordering
  const selectedOrdering = chordOrderings[Math.floor(Math.random() * chordOrderings.length)];
  
  // Build voicing with close spacing - each note 3rd or 4th apart
  const voicing = [];
  let previousNotePosition = null; // Track actual position of previous note
  
  for (let i = 0; i < selectedOrdering.length; i++) {
    const noteIndex = selectedOrdering[i];
    
    if (i === 0) {
      // First note - place in middle register (octave 0)
      const adjustedIndex = noteIndex + (0 * 7);
      voicing.push(convertNoteIndexToABC(adjustedIndex, octaveOffset, maxOctavesLower));
      previousNotePosition = adjustedIndex;
    } else {
      // Subsequent notes - find closest position that's 3rd or 4th above previous note
      let bestOctave = 0;
      let bestInterval = Infinity;
      
      // Try different octaves to find the one that gives 3rd or 4th interval
      for (let testOctave = -1; testOctave <= 2; testOctave++) {
        const testPosition = noteIndex + (testOctave * 7);
        const interval = testPosition - previousNotePosition;
        
        // Check if this interval is 3rd or 4th (2-4 semitones) and ascending
        if (interval >= 2 && interval <= 4) {
          bestOctave = testOctave;
          bestInterval = interval;
          break; // Found a good interval, use it
        }
      }
      
      // If no perfect 3rd/4th found, use the closest interval that's ascending
      if (bestInterval === Infinity) {
        for (let testOctave = 0; testOctave <= 2; testOctave++) {
          const testPosition = noteIndex + (testOctave * 7);
          const interval = testPosition - previousNotePosition;
          
          if (interval > 0 && interval < bestInterval) {
            bestOctave = testOctave;
            bestInterval = interval;
          }
        }
      }
      
      // Place the note at the calculated octave
      const adjustedIndex = noteIndex + (bestOctave * 7);
      voicing.push(convertNoteIndexToABC(adjustedIndex, octaveOffset, maxOctavesLower));
      previousNotePosition = adjustedIndex;
    }
  }
  
  return voicing;
}

/**
 * Generate a right-hand 4-note chord measure
 * @param {number} startIndex - Starting note index
 * @param {number} lowestIndex - Lowest allowed note index
 * @param {number} octaveOffset - Octave offset for note positioning
 * @param {number} highestIndex - Highest allowed note index
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @param {string[]} chordNotes - Current chord notes for harmonic context
 * @param {number} totalBeatsPerMeasure - Total beats in the measure
 * @param {number[]} intervals - Available intervals for movement
 * @param {object[]} availableDurations - Available note durations
 * @param {string} key - Musical key for harmonic context
 * @param {string} selectedChordType - Selected chord type ('major', '7th')
 * @returns {string} ABC notation for right-hand 4-note chord measure
 */
function generateRightHand4NoteChords(startIndex, lowestIndex, octaveOffset, highestIndex, maxOctavesLower, chordNotes, totalBeatsPerMeasure, intervals, availableDurations, key, selectedChordType) {
  let measure = '';
  let beatsUsed = 0;
  
  // If no chord notes provided, use default C major chord
  const currentChordNotes = chordNotes || ['C', 'E', 'G'];
  
  while (beatsUsed < totalBeatsPerMeasure) {
    // Generate a 4-note chord using chord tones
    const chordVoicing = generate4NoteChordVoicing(currentChordNotes, octaveOffset, maxOctavesLower, selectedChordType);
    
    // Select duration that fits in remaining beats
    const remainingBeats = totalBeatsPerMeasure - beatsUsed;
    const validDurations = availableDurations.filter(d => d.beats <= remainingBeats);
    
    if (validDurations.length === 0) {
      const shortestDuration = availableDurations.reduce((shortest, current) => 
        current.beats < shortest.beats ? current : shortest
      );
      
      measure += `[${chordVoicing.join('')}]${shortestDuration.abcNotation}`;
      beatsUsed += shortestDuration.beats;
      break;
    }
    
    const selectedDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
    
    // Add 4-note chord to measure
    measure += `[${chordVoicing.join('')}]${selectedDuration.abcNotation}`;
    beatsUsed += selectedDuration.beats;
    
    // Add space after chord if not at end of measure
    if (selectedDuration.abcNotation && beatsUsed < totalBeatsPerMeasure) {
      measure += ' ';
    }
  }
  
  return measure + '|';
}

/**
 * Generate a 4-note chord voicing using chord tones with varied inversions and octaves
 * @param {string[]} chordNotes - Current chord notes (root, third, fifth)
 * @param {number} octaveOffset - Octave offset for note positioning
 * @param {number} maxOctavesLower - Maximum octaves lower allowed
 * @param {string} chordType - Type of chord ('major', '7th')
 * @returns {string[]} Array of ABC notation strings for the 4 chord notes
 */
function generate4NoteChordVoicing(chordNotes, octaveOffset, maxOctavesLower, chordType) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  if (chordNotes.length < 3) {
    // Fallback to default C major chord if not enough notes
    chordNotes = ['C', 'E', 'G'];
  }
  
  // Extract chord tones
  const root = chordNotes[0];
  const third = chordNotes[1];
  const fifth = chordNotes[2];
  
  // Convert chord note names to note indices
  const rootIndex = notes.findIndex(note => note === root.replace(/[#b]/g, ''));
  const thirdIndex = notes.findIndex(note => note === third.replace(/[#b]/g, ''));
  const fifthIndex = notes.findIndex(note => note === fifth.replace(/[#b]/g, ''));
  
  // Calculate seventh note index based on chord type
  let seventhIndex;
  if (chordType === '7th') {
    // For 7th chord, add the 7th scale degree
    seventhIndex = (rootIndex + 6) % 7; // 7th is 6 steps from root in scale
  } else {
    // For major chord, double the root for 4-note voicing
    seventhIndex = rootIndex;
  }
  
  // Create 4-note chord voicings
  const chordOrderings = chordType === '7th' ? [
    [rootIndex, thirdIndex, fifthIndex, seventhIndex],  // Root position 7th
    [thirdIndex, fifthIndex, seventhIndex, rootIndex],  // First inversion 7th
    [fifthIndex, seventhIndex, rootIndex, thirdIndex],  // Second inversion 7th
    [seventhIndex, rootIndex, thirdIndex, fifthIndex],  // Third inversion 7th
  ] : [
    [rootIndex, thirdIndex, fifthIndex, rootIndex],     // Root position with doubled root
    [thirdIndex, fifthIndex, rootIndex, thirdIndex],    // First inversion with doubled third
    [fifthIndex, rootIndex, thirdIndex, fifthIndex],    // Second inversion with doubled fifth
  ];
  
  // Randomly select a chord ordering
  const selectedOrdering = chordOrderings[Math.floor(Math.random() * chordOrderings.length)];
  
  // Build voicing with close spacing - each note 2nd-4th apart
  const voicing = [];
  let previousNotePosition = null;
  
  for (let i = 0; i < selectedOrdering.length; i++) {
    const noteIndex = selectedOrdering[i];
    
    if (i === 0) {
      // First note - place in middle register (octave 0)
      const adjustedIndex = noteIndex + (0 * 7);
      voicing.push(convertNoteIndexToABC(adjustedIndex, octaveOffset, maxOctavesLower));
      previousNotePosition = adjustedIndex;
    } else {
      // Subsequent notes - find closest position that's 2nd-4th above previous note
      let bestOctave = 0;
      let bestInterval = Infinity;
      
      // Try different octaves to find the one that gives 2nd-4th interval
      for (let testOctave = -1; testOctave <= 2; testOctave++) {
        const testPosition = noteIndex + (testOctave * 7);
        const interval = testPosition - previousNotePosition;
        
        // Check if this interval is 2nd-4th (1-4 scale steps) and ascending
        if (interval >= 1 && interval <= 4) {
          bestOctave = testOctave;
          bestInterval = interval;
          break;
        }
      }
      
      // If no perfect 2nd-4th found, use the closest interval that's ascending
      if (bestInterval === Infinity) {
        for (let testOctave = 0; testOctave <= 2; testOctave++) {
          const testPosition = noteIndex + (testOctave * 7);
          const interval = testPosition - previousNotePosition;
          
          if (interval > 0 && interval < bestInterval) {
            bestOctave = testOctave;
            bestInterval = interval;
          }
        }
      }
      
      // Place the note at the calculated octave
      const adjustedIndex = noteIndex + (bestOctave * 7);
      voicing.push(convertNoteIndexToABC(adjustedIndex, octaveOffset, maxOctavesLower));
      previousNotePosition = adjustedIndex;
    }
  }
  
  return voicing;
}