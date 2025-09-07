import { supabase } from '../lib/supabaseClient.js';

// User Authentication Functions

/**
 * Register a new user
 * @param {string} username - User's chosen username
 * @param {string} password - User's password
 * @returns {Object} { success: boolean, user?: object, error?: string }
 */
export const registerUser = async (username, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Username already exists' };
      }
      throw error;
    }

    return { 
      success: true, 
      user: { 
        id: data.id, 
        username: data.username,
        name: data.username 
      } 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
};

/**
 * Login user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Object} { success: boolean, user?: object, error?: string }
 */
export const loginUser = async (username, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { success: false, error: 'Invalid username or password' };
      }
      throw error;
    }

    return { 
      success: true, 
      user: { 
        id: data.id, 
        username: data.username,
        name: data.username,
        loginMethod: 'username'
      } 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

// Exercise Configuration Functions

/**
 * Convert settings object to database format
 * @param {Object} settings - Current app settings
 * @returns {Object} Database-compatible object
 */
export const settingsToDb = (settings) => {
  return {
    key_signature: settings.key,
    time_signature: settings.timeSignature,
    measures: settings.measures,
    intervals: settings.intervals || [],
    note_durations: settings.noteDurations || [],
    chord_progressions: settings.chordProgressions || [],
    rh_patterns: settings.rightHandPatterns || [],
    lh_patterns: settings.leftHandPatterns || [],
    swap_hand_patterns: settings.swapHandPatterns || false
  };
};

/**
 * Convert database row to settings object
 * @param {Object} dbRow - Database row from saved_exercises
 * @returns {Object} Settings object compatible with app state
 */
export const dbToSettings = (dbRow) => {
  return {
    key: dbRow.key_signature,
    timeSignature: dbRow.time_signature,
    measures: dbRow.measures,
    intervals: dbRow.intervals || [1, 2, 3, 4, 5],
    noteDurations: dbRow.note_durations || ['1/8', '1/4'],
    chordProgressions: dbRow.chord_progressions || ['pop', '50s', 'pop-variation'],
    rightHandPatterns: dbRow.rh_patterns || ['single-notes'],
    leftHandPatterns: dbRow.lh_patterns || ['block-chords'],
    swapHandPatterns: dbRow.swap_hand_patterns || false,
    // Keep other default settings that aren't stored in DB
    tempo: 120,
    leftHandBrokenChords: ['1-3-5-3'],
    rightHandIntervals: ['2nd'],
    rightHand4NoteChords: ['major'],
    chordTypes: ['major', 'minor'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],
    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],
    musicScale: 1.0,
    selectedLevel: null
  };
};

/**
 * Save exercise configuration to database
 * @param {number} userId - User's ID
 * @param {Object} settings - Current settings to save
 * @returns {Object} { success: boolean, exercise?: object, error?: string }
 */
export const saveExerciseConfig = async (userId, settings) => {
  try {
    const configData = settingsToDb(settings);
    
    const { data, error } = await supabase
      .from('saved_exercises')
      .insert([{ 
        user_id: userId, 
        ...configData
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, exercise: data };
  } catch (error) {
    console.error('Save configuration error:', error);
    return { success: false, error: 'Failed to save configuration' };
  }
};

/**
 * Get all saved exercise configurations for a user
 * @param {number} userId - User's ID
 * @returns {Object} { success: boolean, exercises?: array, error?: string }
 */
export const getUserExercises = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('saved_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) throw error;

    return { success: true, exercises: data };
  } catch (error) {
    console.error('Get user exercises error:', error);
    return { success: false, error: 'Failed to load configurations' };
  }
};

/**
 * Delete a saved exercise configuration
 * @param {number} exerciseId - Exercise ID to delete
 * @param {number} userId - User's ID (for security)
 * @returns {Object} { success: boolean, error?: string }
 */
export const deleteExercise = async (exerciseId, userId) => {
  try {
    const { error } = await supabase
      .from('saved_exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', userId); // Ensure user can only delete their own exercises

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete exercise error:', error);
    return { success: false, error: 'Failed to delete configuration' };
  }
};

/**
 * Increment the exercises_generated counter for a user
 * @param {string} userId - User's ID
 * @returns {Object} { success: boolean, error?: string }
 */
export const incrementExercisesGenerated = async (userId) => {
  try {
    // First, get the current value and increment it
    const { data: currentData, error: fetchError } = await supabase
      .from('profiles')
      .select('exercises_generated')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current exercises_generated:', fetchError);
      throw fetchError;
    }

    const currentCount = currentData?.exercises_generated || 0;
    const newCount = currentCount + 1;

    // Update with the incremented value
    const { error } = await supabase
      .from('profiles')
      .update({ exercises_generated: newCount })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Increment exercises generated error:', error);
    return { success: false, error: 'Failed to update exercise counter' };
  }
};

/**
 * Update the date_last_practiced field for a user
 * @param {string} userId - User's ID
 * @returns {Object} { success: boolean, error?: string }
 */
export const updateLastPracticed = async (userId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ date_last_practiced: new Date().toISOString().split('T')[0] })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Update last practiced error:', error);
    return { success: false, error: 'Failed to update last practice date' };
  }
};

/**
 * Get user profile data including exercises_generated
 * @param {string} userId - User's ID
 * @returns {Object} { success: boolean, profile?: object, error?: string }
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('exercises_generated')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // User profile doesn't exist yet, return default values
        return { 
          success: true, 
          profile: { exercises_generated: 0 } 
        };
      }
      throw error;
    }

    return { 
      success: true, 
      profile: { 
        exercises_generated: data?.exercises_generated || 0 
      } 
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { success: false, error: 'Failed to load profile data' };
  }
};

// User Settings Functions - Removed database storage, using localStorage only
