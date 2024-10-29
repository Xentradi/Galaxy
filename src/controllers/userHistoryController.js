import userHistoryRepository from '../repositories/userHistoryRepository.js';
import {ModAction} from '../models/constants.js';

/**
 * Get user history from database
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User history object
 */
async function getUserHistory(userId) {
  try {
    return await userHistoryRepository.getUserHistory(userId);
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw error;
  }
}

/**
 * Calculate strike weight based on infraction history
 * @param {Object} userHistory - User history object
 * @returns {number} Calculated strike weight
 */
function calculateStrikeWeight(userHistory) {
  if (!userHistory?.infractions?.length) return 0;

  return userHistory.infractions.reduce((weight, infraction) => {
    const age = Date.now() - infraction.timestamp;
    const decayFactor = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30-day decay
    return weight + (infraction.severity * decayFactor);
  }, 0);
}

/**
 * Get recent infractions by type within a timeframe
 * @param {Object} userHistory - User history object
 * @param {string} timeframe - Timeframe in days (e.g., '30d')
 * @returns {Object} Count of recent infractions by type
 */
function getRecentInfractions(userHistory, timeframe) {
  if (!userHistory?.infractions?.length) {
    return {warns: 0, mutes: 0, tempBans: 0};
  }

  const cutoff = calculateCutoffDate(timeframe);
  const recent = userHistory.infractions.filter(i => i.timestamp >= cutoff);

  return {
    warns: recent.filter(i => i.type === ModAction.WARN).length,
    mutes: recent.filter(i => i.type === ModAction.MUTE).length,
    tempBans: recent.filter(i => i.type === ModAction.TEMP_BAN).length
  };
}

/**
 * Calculate cutoff date for timeframe
 * @param {string} timeframe - Timeframe in days (e.g., '30d')
 * @returns {Date} Cutoff date
 */
function calculateCutoffDate(timeframe) {
  const days = parseInt(timeframe);
  return new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
}

/**
 * Check if user is considered new
 * @param {Object} userHistory - User history object
 * @returns {boolean} Whether user is new
 */
function isNewUser(userHistory) {
  return !userHistory?.created ||
    (Date.now() - userHistory.created) < (5 * 24 * 60 * 60 * 1000);
}

/**
 * Log moderation action to user history
 * @param {Object} data - Moderation data to log
 * @returns {Promise<void>}
 */
async function logModeration(data) {
  // Only log if an action other than ALLOW or REVIEW is taken
  if (data.action !== ModAction.ALLOW && data.action !== ModAction.REVIEW) {
    try {
      await userHistoryRepository.addInfraction(data.userId, {
        type: data.action,
        category: data.analysis.flaggedCategory,
        severity: data.analysis.highestSeverity,
        timestamp: data.timestamp,
        content: data.content,
        context: data.context,
        action: data.action,
        decay: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30-day decay
      });
    } catch (error) {
      console.error('Error logging moderation:', error);
      throw error;
    }
  }
}

export {
  getUserHistory,
  calculateStrikeWeight,
  getRecentInfractions,
  isNewUser,
  logModeration
};
