import { supabase } from '../lib/supabaseClient';

/**
 * Service for managing saved exercises in the database
 */
export class ExerciseService {
  /**
   * Save an exercise configuration to the database
   * @param {string} exerciseName - Name of the exercise
   * @param {Object} settings - Exercise configuration settings
   * @param {string} userId - ID of the user saving the exercise
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async saveExercise(exerciseName, settings, userId) {
    try {
      if (!exerciseName || !exerciseName.trim()) {
        return { success: false, error: 'Exercise name is required' };
      }

      if (!userId) {
        return { success: false, error: 'User authentication required' };
      }

      // Prepare the exercise data for database storage
      const exerciseData = {
        user_id: userId,
        exercise_name: exerciseName.trim(),
        key_signature: settings.key || 'C',
        time_signature: settings.timeSignature || '4/4',
        measures: settings.measures || 8,
        tempo: settings.tempo || 120,
        intervals: settings.intervals || [1, 2, 3, 4, 5],
        note_durations: settings.noteDurations || ['1/8', '1/4'],
        chord_progressions: settings.chordProgressions || ['pop'],
        left_hand_patterns: settings.leftHandPatterns || ['block-chords'],
        left_hand_broken_chords: settings.leftHandBrokenChords || ['1-3-5-3'],
        right_hand_patterns: settings.rightHandPatterns || ['single-notes'],
        right_hand_intervals: settings.rightHandIntervals || ['2nd'],
        right_hand_4_note_chords: settings.rightHand4NoteChords || ['major'],
        swap_hand_patterns: settings.swapHandPatterns || false,
        chord_types: settings.chordTypes || ['major', 'minor'],
        chord_inversions: settings.chordInversions || ['root'],
        chord_voicings: settings.chordVoicings || ['closed'],
        chord_rhythms: settings.chordRhythms || ['straight'],
        melodic_patterns: settings.melodicPatterns || ['melodies'],
        melodic_articulations: settings.melodicArticulations || ['legato'],
        music_scale: settings.musicScale || 1.0,
        selected_level: settings.selectedLevel
      };

      const { data, error } = await supabase
        .from('saved_exercises')
        .insert([exerciseData])
        .select()
        .single();

      if (error) {
        console.error('Database error saving exercise:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to save exercise' 
        };
      }

      return { 
        success: true, 
        data: data 
      };

    } catch (err) {
      console.error('Error saving exercise:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred while saving' 
      };
    }
  }

  /**
   * Get all saved exercises for a user
   * @param {string} userId - ID of the user
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  static async getUserExercises(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User authentication required' };
      }

      const { data, error } = await supabase
        .from('saved_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching exercises:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to fetch exercises' 
        };
      }

      return { 
        success: true, 
        data: data || [] 
      };

    } catch (err) {
      console.error('Error fetching exercises:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred while fetching exercises' 
      };
    }
  }

  /**
   * Get a specific exercise by ID (with user ownership verification)
   * @param {string} exerciseId - ID of the exercise
   * @param {string} userId - ID of the user
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getExercise(exerciseId, userId) {
    try {
      if (!exerciseId || !userId) {
        return { success: false, error: 'Exercise ID and user authentication required' };
      }

      const { data, error } = await supabase
        .from('saved_exercises')
        .select('*')
        .eq('id', exerciseId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Exercise not found' };
        }
        console.error('Database error fetching exercise:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to fetch exercise' 
        };
      }

      return { 
        success: true, 
        data: data 
      };

    } catch (err) {
      console.error('Error fetching exercise:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred while fetching exercise' 
      };
    }
  }

  /**
   * Delete an exercise (with user ownership verification)
   * @param {string} exerciseId - ID of the exercise
   * @param {string} userId - ID of the user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteExercise(exerciseId, userId) {
    try {
      if (!exerciseId || !userId) {
        return { success: false, error: 'Exercise ID and user authentication required' };
      }

      const { error } = await supabase
        .from('saved_exercises')
        .delete()
        .eq('id', exerciseId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error deleting exercise:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to delete exercise' 
        };
      }

      return { success: true };

    } catch (err) {
      console.error('Error deleting exercise:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred while deleting exercise' 
      };
    }
  }

  /**
   * Convert database exercise record back to settings format
   * @param {Object} exerciseRecord - Database record
   * @returns {Object} Settings object
   */
  static convertToSettings(exerciseRecord) {
    return {
      key: exerciseRecord.key_signature,
      timeSignature: exerciseRecord.time_signature,
      measures: exerciseRecord.measures,
      tempo: exerciseRecord.tempo,
      intervals: exerciseRecord.intervals,
      noteDurations: exerciseRecord.note_durations,
      chordProgressions: exerciseRecord.chord_progressions,
      leftHandPatterns: exerciseRecord.left_hand_patterns,
      leftHandBrokenChords: exerciseRecord.left_hand_broken_chords,
      rightHandPatterns: exerciseRecord.right_hand_patterns,
      rightHandIntervals: exerciseRecord.right_hand_intervals,
      rightHand4NoteChords: exerciseRecord.right_hand_4_note_chords,
      swapHandPatterns: exerciseRecord.swap_hand_patterns,
      chordTypes: exerciseRecord.chord_types,
      chordInversions: exerciseRecord.chord_inversions,
      chordVoicings: exerciseRecord.chord_voicings,
      chordRhythms: exerciseRecord.chord_rhythms,
      melodicPatterns: exerciseRecord.melodic_patterns,
      melodicArticulations: exerciseRecord.melodic_articulations,
      musicScale: exerciseRecord.music_scale,
      selectedLevel: exerciseRecord.selected_level
    };
  }
}