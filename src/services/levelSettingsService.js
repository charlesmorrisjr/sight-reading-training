/**
 * Level Settings Service
 *
 * Manages level-based settings for Flow Mode with user customization support.
 *
 * Architecture:
 * - Default level configurations from levelConfigurations.js
 * - User overrides stored in localStorage (for both guest and authenticated users)
 * - Merged settings = Level defaults + User overrides
 *
 * User overrides are stored per level:
 * {
 *   "1": { tempo: 90, measures: 6 },  // User customizations for Level 1
 *   "3": { key: 'G' }                 // User customizations for Level 3
 * }
 */

import { getLevelConfiguration, isValidLevel } from '../config/levelConfigurations.js';

// LocalStorage key for level overrides
const LEVEL_OVERRIDES_KEY = 'practisia-level-overrides';

/**
 * Load all user level overrides from localStorage
 * @returns {Object} Object with level numbers as keys and override settings as values
 */
const loadAllLevelOverrides = () => {
  try {
    const saved = localStorage.getItem(LEVEL_OVERRIDES_KEY);
    if (!saved) return {};

    const parsed = JSON.parse(saved);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error('Failed to load level overrides from localStorage:', error);
    return {};
  }
};

/**
 * Save all level overrides to localStorage
 * @param {Object} overrides - Object with level numbers as keys and override settings as values
 * @returns {Object} Result object with success status
 */
const saveAllLevelOverrides = (overrides) => {
  try {
    localStorage.setItem(LEVEL_OVERRIDES_KEY, JSON.stringify(overrides));
    return { success: true };
  } catch (error) {
    console.error('Failed to save level overrides to localStorage:', error);
    return { success: false, error: 'Failed to save overrides' };
  }
};

/**
 * Get user overrides for a specific level
 * @param {number} levelNumber - Level number (1-10)
 * @returns {Object|null} User override settings for this level, or null if none exist
 */
export const getUserLevelOverrides = (levelNumber) => {
  if (!isValidLevel(levelNumber)) {
    console.warn(`Cannot get overrides for invalid level: ${levelNumber}`);
    return null;
  }

  const allOverrides = loadAllLevelOverrides();
  return allOverrides[levelNumber] || null;
};

/**
 * Get complete settings for a level (merged defaults + user overrides)
 * @param {number} levelNumber - Level number (1-10)
 * @returns {Object|null} Complete settings object, or null if level is invalid
 */
export const getLevelSettings = (levelNumber) => {
  if (!isValidLevel(levelNumber)) {
    console.warn(`Cannot get settings for invalid level: ${levelNumber}`);
    return null;
  }

  // Get default configuration for this level
  const defaultConfig = getLevelConfiguration(levelNumber);
  if (!defaultConfig) {
    console.error(`No default configuration found for level ${levelNumber}`);
    return null;
  }

  // Get user overrides for this level
  const userOverrides = getUserLevelOverrides(levelNumber);

  // Merge: defaults + user overrides
  const mergedSettings = {
    ...defaultConfig,
    ...(userOverrides || {})
  };

  console.log(`Level ${levelNumber} settings loaded:`, {
    hasOverrides: !!userOverrides,
    overrideKeys: userOverrides ? Object.keys(userOverrides) : []
  });

  return mergedSettings;
};

/**
 * Save user customizations for a specific level
 * @param {number} levelNumber - Level number (1-10)
 * @param {Object} customSettings - Settings to override (partial settings object)
 * @returns {Object} Result object with success status
 */
export const saveUserLevelOverrides = (levelNumber, customSettings) => {
  if (!isValidLevel(levelNumber)) {
    return {
      success: false,
      error: `Invalid level number: ${levelNumber}`
    };
  }

  if (!customSettings || typeof customSettings !== 'object') {
    return {
      success: false,
      error: 'Custom settings must be an object'
    };
  }

  try {
    // Load all existing overrides
    const allOverrides = loadAllLevelOverrides();

    // Get existing overrides for this level
    const existingLevelOverrides = allOverrides[levelNumber] || {};

    // Merge existing overrides with new customizations
    const updatedLevelOverrides = {
      ...existingLevelOverrides,
      ...customSettings
    };

    // Update the overrides object
    allOverrides[levelNumber] = updatedLevelOverrides;

    // Save back to localStorage
    const saveResult = saveAllLevelOverrides(allOverrides);

    if (saveResult.success) {
      console.log(`Level ${levelNumber} overrides saved:`, Object.keys(customSettings));
      return { success: true, overrides: updatedLevelOverrides };
    } else {
      return saveResult;
    }
  } catch (error) {
    console.error(`Failed to save overrides for level ${levelNumber}:`, error);
    return {
      success: false,
      error: 'Failed to save level overrides'
    };
  }
};

/**
 * Reset a level back to its default configuration
 * Removes all user customizations for that level
 * @param {number} levelNumber - Level number (1-10)
 * @returns {Object} Result object with success status and default settings
 */
export const resetLevelToDefaults = (levelNumber) => {
  if (!isValidLevel(levelNumber)) {
    return {
      success: false,
      error: `Invalid level number: ${levelNumber}`
    };
  }

  try {
    // Load all existing overrides
    const allOverrides = loadAllLevelOverrides();

    // Remove overrides for this level
    delete allOverrides[levelNumber];

    // Save back to localStorage
    const saveResult = saveAllLevelOverrides(allOverrides);

    if (saveResult.success) {
      console.log(`Level ${levelNumber} reset to defaults`);

      // Return the default settings
      const defaultSettings = getLevelConfiguration(levelNumber);
      return {
        success: true,
        settings: defaultSettings
      };
    } else {
      return saveResult;
    }
  } catch (error) {
    console.error(`Failed to reset level ${levelNumber}:`, error);
    return {
      success: false,
      error: 'Failed to reset level'
    };
  }
};

/**
 * Check if a level has any user customizations
 * @param {number} levelNumber - Level number (1-10)
 * @returns {boolean} True if level has user overrides
 */
export const hasUserOverrides = (levelNumber) => {
  if (!isValidLevel(levelNumber)) return false;

  const overrides = getUserLevelOverrides(levelNumber);
  return overrides !== null && Object.keys(overrides).length > 0;
};

/**
 * Get a list of all levels that have user customizations
 * @returns {number[]} Array of level numbers that have overrides
 */
export const getCustomizedLevels = () => {
  const allOverrides = loadAllLevelOverrides();
  return Object.keys(allOverrides)
    .map(Number)
    .filter(levelNum => isValidLevel(levelNum))
    .sort((a, b) => a - b);
};

/**
 * Clear all level overrides (reset all levels to defaults)
 * Use with caution - this removes all user customizations
 * @returns {Object} Result object with success status
 */
export const clearAllLevelOverrides = () => {
  try {
    localStorage.removeItem(LEVEL_OVERRIDES_KEY);
    console.log('All level overrides cleared');
    return { success: true };
  } catch (error) {
    console.error('Failed to clear level overrides:', error);
    return {
      success: false,
      error: 'Failed to clear overrides'
    };
  }
};

/**
 * Export level overrides as JSON (for backup/migration)
 * @returns {string} JSON string of all level overrides
 */
export const exportLevelOverrides = () => {
  const allOverrides = loadAllLevelOverrides();
  return JSON.stringify(allOverrides, null, 2);
};

/**
 * Import level overrides from JSON (for backup/migration)
 * @param {string} jsonString - JSON string of level overrides
 * @returns {Object} Result object with success status
 */
export const importLevelOverrides = (jsonString) => {
  try {
    const overrides = JSON.parse(jsonString);

    if (typeof overrides !== 'object' || overrides === null) {
      return {
        success: false,
        error: 'Invalid overrides format'
      };
    }

    return saveAllLevelOverrides(overrides);
  } catch (error) {
    console.error('Failed to import level overrides:', error);
    return {
      success: false,
      error: 'Failed to parse JSON'
    };
  }
};
