/**
 * @typedef {Object} ClientConfig
 * @property {string} apiUrl - The GalaxyGuard API URL
 * @property {string} clientId - OAuth client ID
 * @property {string} clientSecret - OAuth client secret
 * @property {'moderate' | 'log'} [mode='moderate'] - Operation mode
 */

/**
 * @typedef {Object} Message
 * @property {string} content - Message content
 * @property {string} channelType - Channel type (e.g., 'twitch')
 * @property {string} channelId - Channel identifier
 * @property {string} [userId] - User identifier
 * @property {string} [username] - Username
 */

/**
 * @typedef {Object} Channel
 * @property {string} id - Channel identifier
 */

/**
 * @typedef {Object} ModerationResult
 * @property {'allow' | 'warn' | 'delete'} action - Moderation action
 * @property {number} severity - Severity score (0.0-1.0)
 * @property {Object} analysis - Content analysis
 * @property {string} analysis.flaggedCategory - Main category flagged
 * @property {Object} analysis.categories - Category scores
 */

/**
 * @typedef {Object} MessageResponse
 * @property {string} _id - Message identifier
 * @property {string} content - Message content
 * @property {string} channelType - Channel type
 * @property {string} channelId - Channel identifier
 * @property {string} [userId] - User identifier
 * @property {string} [username] - Username
 * @property {string} createdAt - Creation timestamp
 * @property {ModerationResult} [moderation] - Moderation data if available
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} [limit] - Number of items to return
 * @property {string} [before] - Get items before this timestamp
 * @property {string} [after] - Get items after this timestamp
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array<MessageResponse>} messages - List of messages
 * @property {Object} pagination - Pagination metadata
 * @property {boolean} pagination.hasMore - Whether more items exist
 * @property {string} [pagination.nextCursor] - Cursor for next page
 */

/**
 * @typedef {Object} ModerationUpdate
 * @property {'allow' | 'warn' | 'delete'} action - Moderation action
 * @property {string} reason - Reason for moderation
 * @property {string} moderatorId - ID of moderator
 */

/**
 * @typedef {Object} TokenResponse
 * @property {string} access_token - JWT access token
 * @property {string} token_type - Token type (Bearer)
 * @property {number} expires_in - Token expiration in seconds
 */

export const ChannelType = {
  TWITCH: 'twitch'
};

export const ModerationAction = {
  ALLOW: 'allow',
  WARN: 'warn',
  DELETE: 'delete'
};

export const Mode = {
  MODERATE: 'moderate',
  LOG: 'log'
};
