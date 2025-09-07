import { incrementExercisesGenerated } from './database.js';
import { ExerciseService } from './exerciseService.js';

// Default settings structure
export const DEFAULT_SETTINGS = {
  key: 'C',
  timeSignature: '4/4',
  measures: 8,
  tempo: 120,
  intervals: [1, 2, 3, 4, 5],
  noteDurations: ['1/8', '1/4'],
  chordProgressions: ['pop', '50s', 'pop-variation', 'basic-cadence', 'jazz', 'alternating', 'minor-start', 'variation'],
  leftHandPatterns: ['block-chords'],
  leftHandBrokenChords: ['1-3-5-3'],
  rightHandPatterns: ['single-notes'],
  rightHandIntervals: ['2nd'],
  rightHand4NoteChords: ['major'],
  swapHandPatterns: false,
  chordTypes: ['major', 'minor'],
  chordInversions: ['root'],
  chordVoicings: ['closed'],
  chordRhythms: ['straight'],
  melodicPatterns: ['melodies'],
  melodicArticulations: ['legato'],
  musicScale: 1.0,
  selectedLevel: null
};

// LocalStorage keys for all users (guest and authenticated)
const USER_SETTINGS_KEY = 'practisia-user-settings';
const GUEST_EXERCISES_GENERATED_KEY = 'practisia-guest-exercises-generated';
const GUEST_SAVED_EXERCISES_KEY = 'practisia-guest-saved-exercises';

/**
 * Save settings to localStorage for all users
 */
export const saveGuestSettings = (settings) => {
  try {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    return { success: false, error: 'Failed to save settings' };
  }
};

/**
 * Load settings from localStorage for all users
 */
export const loadGuestSettings = () => {
  try {
    const savedSettings = localStorage.getItem(USER_SETTINGS_KEY);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Merge with defaults to ensure all required properties exist
      return { 
        success: true, 
        settings: { ...DEFAULT_SETTINGS, ...parsedSettings }
      };
    }
    return { success: true, settings: DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return { success: true, settings: DEFAULT_SETTINGS };
  }
};

/**
 * Clear settings from localStorage
 */
export const clearGuestSettings = () => {
  try {
    localStorage.removeItem(USER_SETTINGS_KEY);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear settings:', error);
    return { success: false, error: 'Failed to clear settings' };
  }
};

/**
 * Load settings from localStorage for all users (guest and authenticated)
 */
export const loadUserSettings = async (user) => {
  // All users now use localStorage for settings
  return loadGuestSettings();
};

/**
 * Save settings to localStorage for all users (guest and authenticated)
 */
export const saveUserSettings = async (user, settings) => {
  // All users now use localStorage for settings
  return saveGuestSettings(settings);
};

// Guest Exercise Data Functions

/**
 * Save exercises generated counter to localStorage for guest users
 */
export const saveGuestExercisesGenerated = (count) => {
  try {
    localStorage.setItem(GUEST_EXERCISES_GENERATED_KEY, count.toString());
    return { success: true };
  } catch (error) {
    console.error('Failed to save guest exercises generated count:', error);
    return { success: false, error: 'Failed to save exercises count' };
  }
};

/**
 * Load exercises generated counter from localStorage for guest users
 */
export const loadGuestExercisesGenerated = () => {
  try {
    const saved = localStorage.getItem(GUEST_EXERCISES_GENERATED_KEY);
    const count = saved ? parseInt(saved, 10) : 0;
    return { success: true, count: isNaN(count) ? 0 : count };
  } catch (error) {
    console.error('Failed to load guest exercises generated count:', error);
    return { success: true, count: 0 };
  }
};

/**
 * Increment exercises generated counter for guest users
 */
export const incrementGuestExercisesGenerated = () => {
  try {
    const current = loadGuestExercisesGenerated();
    const newCount = current.count + 1;
    saveGuestExercisesGenerated(newCount);
    return { success: true, count: newCount };
  } catch (error) {
    console.error('Failed to increment guest exercises generated count:', error);
    return { success: false, error: 'Failed to increment exercises count' };
  }
};

/**
 * Save an exercise to localStorage for guest users
 */
export const saveGuestExercise = (exercise) => {
  try {
    const existing = loadGuestExercises();
    const exercises = existing.success ? existing.exercises : [];
    
    // Add unique ID and timestamp if not present
    const exerciseToSave = {
      ...exercise,
      id: exercise.id || Date.now().toString(),
      created_at: exercise.created_at || new Date().toISOString()
    };
    
    exercises.push(exerciseToSave);
    localStorage.setItem(GUEST_SAVED_EXERCISES_KEY, JSON.stringify(exercises));
    
    return { success: true, exercise: exerciseToSave };
  } catch (error) {
    console.error('Failed to save guest exercise:', error);
    return { success: false, error: 'Failed to save exercise' };
  }
};

/**
 * Load saved exercises from localStorage for guest users
 */
export const loadGuestExercises = () => {
  try {
    const saved = localStorage.getItem(GUEST_SAVED_EXERCISES_KEY);
    const exercises = saved ? JSON.parse(saved) : [];
    return { success: true, exercises: Array.isArray(exercises) ? exercises : [] };
  } catch (error) {
    console.error('Failed to load guest exercises:', error);
    return { success: true, exercises: [] };
  }
};

/**
 * Delete an exercise from localStorage for guest users
 */
export const deleteGuestExercise = (exerciseId) => {
  try {
    const existing = loadGuestExercises();
    if (!existing.success) {
      return { success: false, error: 'Failed to load exercises' };
    }
    
    const filteredExercises = existing.exercises.filter(ex => ex.id !== exerciseId);
    localStorage.setItem(GUEST_SAVED_EXERCISES_KEY, JSON.stringify(filteredExercises));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete guest exercise:', error);
    return { success: false, error: 'Failed to delete exercise' };
  }
};

/**
 * Clear all guest exercise data from localStorage
 */
export const clearGuestExerciseData = () => {
  try {
    localStorage.removeItem(GUEST_EXERCISES_GENERATED_KEY);
    localStorage.removeItem(GUEST_SAVED_EXERCISES_KEY);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear guest exercise data:', error);
    return { success: false, error: 'Failed to clear exercise data' };
  }
};

/**
 * Migrate guest settings and exercise data to authenticated user account
 */
export const migrateGuestSettings = async (userId) => {
  try {
    let migrationOccurred = false;
    const migrationResults = [];
    
    // Migrate guest exercises generated count
    const exercisesGeneratedResult = loadGuestExercisesGenerated();
    if (exercisesGeneratedResult.success && exercisesGeneratedResult.count > 0) {
      try {
        // Update the user's exercises_generated count in the database
        for (let i = 0; i < exercisesGeneratedResult.count; i++) {
          await incrementExercisesGenerated(userId);
        }
        migrationOccurred = true;
        migrationResults.push(`${exercisesGeneratedResult.count} exercises count migrated`);
        console.log(`Guest exercises generated count (${exercisesGeneratedResult.count}) migrated to user account`);
      } catch (error) {
        console.warn('Failed to migrate guest exercises generated count:', error);
        migrationResults.push('Exercises count migration failed');
      }
    }
    
    // Migrate guest saved exercises
    const guestExercisesResult = loadGuestExercises();
    if (guestExercisesResult.success && guestExercisesResult.exercises.length > 0) {
      let exercisesMigrated = 0;
      
      for (const exercise of guestExercisesResult.exercises) {
        try {
          // Convert guest exercise format to database format and save
          const exerciseName = exercise.exercise_name || 'Imported Exercise';
          const exerciseSettings = ExerciseService.convertToSettings ? 
            ExerciseService.convertToSettings(exercise) : 
            {
              key: exercise.key_signature,
              timeSignature: exercise.time_signature,
              measures: exercise.measures,
              tempo: exercise.tempo,
              intervals: exercise.intervals,
              noteDurations: exercise.note_durations,
              // Add other mappings as needed
            };
          
          const saveResult = await ExerciseService.saveExercise(exerciseName, exerciseSettings, userId);
          
          if (saveResult.success) {
            exercisesMigrated++;
          }
        } catch (error) {
          console.warn('Failed to migrate guest exercise:', exercise.exercise_name, error);
        }
      }
      
      if (exercisesMigrated > 0) {
        migrationOccurred = true;
        migrationResults.push(`${exercisesMigrated} exercises migrated`);
        console.log(`${exercisesMigrated} guest exercises migrated to user account`);
      }
    }
    
    // Clear guest exercise data if any migration occurred  
    if (migrationOccurred) {
      clearGuestExerciseData();
      return {
        success: true,
        migrated: true,
        details: migrationResults
      };
    }
    
    return { success: true, migrated: false };
  } catch (error) {
    console.error('Error during guest data migration:', error);
    return { success: false, error: 'Migration error' };
  }
};