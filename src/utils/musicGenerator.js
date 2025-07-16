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
    leftHandPatterns = ['block-chords']
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
    
    // Treble: start at C4 (index 0), lowest G3 (index -3), harmonize with chord
    trebleMeasures.push(generateMeasure(0, -3, 0, null, null, currentChord));
    
    // Bass: generate pattern based on selected left hand patterns
    const selectedLeftHandPattern = leftHandPatterns && leftHandPatterns.length > 0 ? leftHandPatterns[0] : 'block-chords';
    
    if (selectedLeftHandPattern === 'alberti-bass') {
      bassMeasures.push(generateAlbertiBass(currentChord, totalBeatsPerMeasure));
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
  const wholeDuration = totalBeats;
  let durationNotation = '';
  
  if (wholeDuration === 8) {
    durationNotation = '8'; // Whole note in 4/4 time
  } else if (wholeDuration === 6) {
    durationNotation = '6'; // Dotted half note in 3/4 time
  } else if (wholeDuration === 4) {
    durationNotation = '4'; // Half note in 2/4 time
  } else if (wholeDuration === 12) {
    durationNotation = '12'; // Dotted whole note in 6/8 time
  } else {
    durationNotation = wholeDuration.toString();
  }
  
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