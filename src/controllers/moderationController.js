import OpenAIService from '../services/openAIService.js';
import {ModAction, ContentCategory} from '../models/constants.js';
import config from '../config/config.json' assert {type: "json"};
import {
  getUserHistory,
  calculateStrikeWeight,
  getRecentInfractions,
  isNewUser,
  logModeration
} from './userHistoryController.js';

class ContentModerator {
  constructor(config = config.moderation) {
    this.config = config;
  }

  analyzeModerationResponse(moderationResult) {
    const categories = {};
    let highestSeverity = 0;
    let flaggedCategory = null;

    for (const [category, scores] of Object.entries(moderationResult.results[0].categories)) {
      if (scores) {
        const categoryScore = moderationResult.results[0].category_scores[category];
        categories[category] = this._determineCategorySeverity(category, categoryScore);

        if (categoryScore > highestSeverity) {
          highestSeverity = categoryScore;
          flaggedCategory = category;
        }
      }
    }

    return {categories, highestSeverity, flaggedCategory};
  }

  _determineCategorySeverity(category, score) {
    const thresholds = this.config.thresholds[category];
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    if (score >= thresholds.low) return 'low';
    return 'none';
  }

  async determineAction(analysis, context, userHistory) {
    let severityScore = analysis.highestSeverity;
    severityScore = this._applyContextModifiers(severityScore, context, userHistory);
    const strikeWeight = calculateStrikeWeight(userHistory);
    const action = this._determineBaseAction(severityScore, analysis.flaggedCategory);
    return this._escalateAction(action, strikeWeight, userHistory);
  }

  _applyContextModifiers(severity, context, userHistory) {
    let modifiedSeverity = severity;

    if (context.channelType === 'sensitive') {
      modifiedSeverity += severity * this.config.contextModifiers.sensitiveChannel;
    }

    if (userHistory?.trustScore > 50) {
      modifiedSeverity -= severity * this.config.contextModifiers.trustedUser;
    }

    if (isNewUser(userHistory)) {
      modifiedSeverity += severity * this.config.contextModifiers.newUser;
    }

    return Math.max(0, Math.min(1, modifiedSeverity));
  }

  _determineBaseAction(severity, category) {
    if (severity >= 0.9) return ModAction.PERM_BAN;
    if (severity >= 0.7) return ModAction.TEMP_BAN;
    if (severity >= 0.5) return ModAction.MUTE;
    if (severity >= 0.3) return ModAction.WARN;
    if (severity >= 0.1) return ModAction.REVIEW;
    return ModAction.ALLOW;
  }

  _escalateAction(baseAction, strikeWeight, userHistory) {
    const recentInfractions = getRecentInfractions(userHistory, '30d');

    if (baseAction === ModAction.WARN && recentInfractions.warns >= this.config.strikes.warn.limit) {
      return ModAction.MUTE;
    }

    if (baseAction === ModAction.MUTE && recentInfractions.mutes >= this.config.strikes.mute.limit) {
      return ModAction.TEMP_BAN;
    }

    if (baseAction === ModAction.TEMP_BAN && recentInfractions.tempBans >= this.config.strikes.tempBan.limit) {
      return ModAction.PERM_BAN;
    }

    return baseAction;
  }
}

/**
 * Check if current period is high activity
 * @param {string} channelId - The channel ID to check
 * @returns {Promise<boolean>} Whether the period is high activity
 */
async function checkHighActivity(channelId) {
  // Implementation to check if the current period is considered high activity
  // Based on message volume, user count, etc.
  return false;
}

/**
 * Get context data for moderation
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Context data
 */
async function getContextData(req) {
  return {
    channelType: req.body.channelType || 'normal',
    channelId: req.body.channelId,
    timestamp: new Date(),
    isHighActivity: await checkHighActivity(req.body.channelId)
  };
}

/**
 * Moderate content endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function moderateContent(req, res) {
  const moderator = new ContentModerator();

  try {
    const {content} = req.body;
    if (!content) {
      return res.status(400).json({message: 'Content is required'});
    }

    const moderationResult = await OpenAIService.moderateContent(content);
    const analysis = moderator.analyzeModerationResponse(moderationResult);
    const context = await getContextData(req);
    const userHistory = await getUserHistory(req.userId);
    const action = await moderator.determineAction(analysis, context, userHistory);

    await logModeration({
      userId: req.userId,
      content,
      moderationResult,
      analysis,
      action,
      context,
      timestamp: new Date()
    });

    res.json({
      message: 'Content moderated successfully',
      action,
      analysis,
      severity: analysis.highestSeverity
    });
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({
      message: 'Failed to moderate content',
      error: error.message
    });
  }
}

export {
  ContentModerator,
  moderateContent
};
