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
 * @returns {string} ABC notation string
 */
export function generateRandomABC(options) {
  const {
    measures = 8,
    key = 'C',
    timeSignature = '4/4',
    intervals = [1, 2, 3, 4, 5],
    noteDurations = ['1/8', '1/4']
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
  function generateMeasure(startIndex, lowestIndex, octaveOffset = 0, highestIndex = null, maxOctavesLower = null) {
    let lastNoteIndex = startIndex;
    let octaveLower = false;
    let measure = notes[((lastNoteIndex % 7) + 7) % 7];
    let beatsUsed = 1; // Start with one eighth note

    // Fill measure with random notes
    while (beatsUsed < totalBeatsPerMeasure) {
      // Randomly select interval
      let interval = intervals[Math.floor(Math.random() * intervals.length)] - 1;
      // Randomly change interval to negative so notes can go downward
      interval = Math.random() < 0.5 ? -interval : interval;
      
      // Calculate the next index
      let candidateIndex = lastNoteIndex + interval;
      
      // Clamp to bounds
      if (highestIndex !== null && candidateIndex > highestIndex) {
        candidateIndex = lastNoteIndex - Math.abs(interval);
      }
      if (candidateIndex < lowestIndex) {
        candidateIndex = lastNoteIndex + Math.abs(interval);
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
        // Fill with eighth notes if no valid durations
        const remainingEighths = Math.floor(remainingBeats);
        for (let i = 0; i < remainingEighths; i++) {
          measure += nextNote;
          beatsUsed += 1;
        }
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

  // Generate measures for both clefs
  let trebleMeasures = [];
  let bassMeasures = [];
  
  for (let i = 0; i < measures; i++) {
    // Treble: start at C4 (index 0), lowest G3 (index -3)
    trebleMeasures.push(generateMeasure(0, -3, 0));
    // Bass: start at C3 (index 0, but add commas for lower octave), lowest C2 (index -7), highest G3 (index 3), max 1 octave lower
    bassMeasures.push(generateMeasure(0, -7, -7, 3, 1));
  }

  // Build ABC with both voices interleaved
  for (let i = 0; i < measures; i++) {
    abc += `V:1\n${trebleMeasures[i]}\n`;
    abc += `V:2\n${bassMeasures[i]}\n`;
  }

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