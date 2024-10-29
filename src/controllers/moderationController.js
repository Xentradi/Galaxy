const OpenAIService = require('../services/openAIService');
const UserHistory = require('../models/UserHistory');
const {ModAction, ContentCategory} = require('../models/constants');

// Configuration for the moderation system
const moderationConfig = {
  thresholds: {
    [ContentCategory.HATE]: {low: 0.4, medium: 0.7, high: 0.85},
    [ContentCategory.HARASSMENT]: {low: 0.4, medium: 0.7, high: 0.85},
    [ContentCategory.SEXUAL]: {low: 0.5, medium: 0.75, high: 0.9},
    [ContentCategory.VIOLENCE]: {low: 0.5, medium: 0.75, high: 0.9},
    [ContentCategory.SELF_HARM]: {low: 0.3, medium: 0.6, high: 0.8},
    [ContentCategory.SPAM]: {low: 0.6, medium: 0.8, high: 0.9}
  },
  strikes: {
    warn: {limit: 3, decay: '7d'},
    mute: {limit: 2, decay: '30d'},
    tempBan: {limit: 2, decay: '90d'}
  },
  durations: {
    mute: 24,
    tempBan: 168 // 1 week
  },
  contextModifiers: {
    sensitiveChannel: 0.2,
    repeatOffense: 0.3,
    newUser: 0.1,
    trustedUser: -0.2,
    highActivityPeriod: 0.15
  }
};

class ContentModerator {
  constructor(config = moderationConfig) {
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
    const strikeWeight = this._calculateStrikeWeight(userHistory);
    const action = this._determineBaseAction(severityScore, analysis.flaggedCategory);
    return this._escalateAction(action, strikeWeight, userHistory);
  }

  _applyContextModifiers(severity, context, userHistory) {
    let modifiedSeverity = severity;

    if (context.channelType === 'sensitive') {
      modifiedSeverity += severity * this.config.contextModifiers.sensitiveChannel;
    }

    if (userHistory.trustScore > 50) {
      modifiedSeverity -= severity * this.config.contextModifiers.trustedUser;
    }

    if (this._isNewUser(userHistory)) {
      modifiedSeverity += severity * this.config.contextModifiers.newUser;
    }

    return Math.max(0, Math.min(1, modifiedSeverity));
  }

  _calculateStrikeWeight(userHistory) {
    if (!userHistory.infractions.length) return 0;

    return userHistory.infractions.reduce((weight, infraction) => {
      const age = Date.now() - infraction.timestamp;
      const decayFactor = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30-day decay
      return weight + (infraction.severity * decayFactor);
    }, 0);
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
    const recentInfractions = this._getRecentInfractions(userHistory, '30d');

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

  _getRecentInfractions(userHistory, timeframe) {
    const cutoff = this._calculateCutoffDate(timeframe);
    const recent = userHistory.infractions.filter(i => i.timestamp >= cutoff);

    return {
      warns: recent.filter(i => i.type === ModAction.WARN).length,
      mutes: recent.filter(i => i.type === ModAction.MUTE).length,
      tempBans: recent.filter(i => i.type === ModAction.TEMP_BAN).length
    };
  }

  _calculateCutoffDate(timeframe) {
    const days = parseInt(timeframe);
    return new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  }

  _isNewUser(userHistory) {
    return !userHistory.created ||
      (Date.now() - userHistory.created) < (5 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get user history from database
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User history object
 */
async function getUserHistory(userId) {
  try {
    let userHistory = await UserHistory.findOne({userId});
    if (!userHistory) {
      userHistory = new UserHistory({userId});
      await userHistory.save();
    }
    return userHistory;
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw error;
  }
}

/**
 * Log moderation action to database
 * @param {Object} data - Moderation data to log
 * @returns {Promise<void>}
 */
async function logModeration(data) {
  try {
    const userHistory = await UserHistory.findOne({userId: data.userId});
    if (!userHistory) {
      throw new Error('User history not found');
    }

    userHistory.infractions.push({
      type: data.action,
      category: data.analysis.flaggedCategory,
      severity: data.analysis.highestSeverity,
      timestamp: data.timestamp,
      content: data.content,
      context: data.context,
      action: data.action,
      decay: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30-day decay
    });

    userHistory.lastInfraction = data.timestamp;
    userHistory.totalInfractions += 1;
    await userHistory.save();
  } catch (error) {
    console.error('Error logging moderation:', error);
    throw error;
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
exports.moderateContent = async (req, res) => {
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
};

module.exports = {
  ContentModerator,
  moderationConfig,
  moderateContent: exports.moderateContent
};
