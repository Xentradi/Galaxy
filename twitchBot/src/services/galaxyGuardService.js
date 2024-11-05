/**
 * @fileoverview GalaxyGuard service integration for Galaxias chat bot.
 * Handles content moderation, message storage, and interaction with the GalaxyGuard API.
 * @module services/galaxyGuardService
 */

import 'dotenv/config';
import axios from 'axios';

/**
 * @typedef {Object} ModResult
 * @property {'ALLOW'|'WARN'|'MUTE'|'TEMP_BAN'|'PERM_BAN'|'REVIEW'} action - Recommended moderation action
 * @property {Object} analysis - Detailed content analysis
 * @property {Object} analysis.categories - Detected content categories
 * @property {number} analysis.highestSeverity - Highest severity score (0-1)
 * @property {string} analysis.flaggedCategory - Most severe category detected
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} content - Message content
 * @property {string} username - Username of sender
 * @property {string} userId - User ID of sender
 * @property {string} channelName - Channel name
 * @property {string} channelId - Channel ID
 * @property {string} type - Message type (chat, whisper, action, announcement)
 * @property {Array<string>} badges - User's badges
 * @property {Array<Object>} emotes - Message emotes
 * @property {ModResult} [moderationResult] - Moderation result if message was moderated
 */

/**
 * @typedef {Object} MessageOptions
 * @property {number} [limit=100] - Maximum number of messages to retrieve
 * @property {number} [skip=0] - Number of messages to skip
 * @property {string} [startDate] - Start date for message retrieval
 * @property {string} [endDate] - End date for message retrieval
 * @property {boolean} [moderatedOnly=false] - Only retrieve moderated messages
 */

/**
 * Manages authentication tokens for GalaxyGuard API access.
 * Handles caching and automatic renewal of access tokens.
 * @class TokenManager
 */
class GalaxyGuardTokenManager {
  /**
   * Creates a new TokenManager instance.
   * @constructor
   */
  constructor() {
    /** @private {string|null} Current access token */
    this.token = null;
    /** @private {number|null} Token expiration timestamp */
    this.tokenExpiry = null;
    /** @private {number} Buffer time before token expiry in milliseconds */
    this.expiryBuffer = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Retrieves a valid access token, either from cache or by requesting a new one.
   * @async
   * @returns {Promise<string>} A valid access token
   * @throws {Error} If token retrieval fails
   */
  async getToken() {
    if (this.token && this.tokenExpiry && Date.now() < (this.tokenExpiry - this.expiryBuffer)) {
      return this.token;
    }

    const auth = Buffer.from(`${process.env.GALAXYGUARD_CLIENT_ID}:${process.env.GALAXYGUARD_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(`${process.env.GALAXYGUARD_URL}/auth/oauth/token`,
      {grant_type: 'client_credentials'},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    this.token = response.data.access_token;
    this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

    return this.token;
  }
}

/**
 * Client for interacting with the GalaxyGuard API.
 * Handles all API requests and responses.
 * @class GalaxyGuardClient
 */
class GalaxyGuardClient {
  /**
   * Creates a new GalaxyGuardClient instance.
   * @constructor
   * @param {GalaxyGuardTokenManager} tokenManager - Instance of TokenManager for handling authentication
   */
  constructor(tokenManager) {
    /** @private {GalaxyGuardTokenManager} Token manager instance */
    this.tokenManager = tokenManager;
  }

  /**
   * Makes an authenticated request to the GalaxyGuard API.
   * @private
   * @async
   * @param {string} endpoint - API endpoint path
   * @param {Object} [options={}] - Axios request options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If the API request fails
   */
  async request(endpoint, options = {}) {
    const token = await this.tokenManager.getToken();

    try {
      const response = await axios({
        url: `${process.env.GALAXYGUARD_URL}${endpoint}`,
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`GalaxyGuard API error: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Moderates a chat message using GalaxyGuard's moderation service.
   * @async
   * @param {string} content - Message content to moderate
   * @param {string} channelId - Twitch channel ID
   * @param {string} userId - User ID of message sender
   * @param {string} [channelType='normal'] - Channel moderation type ('normal' or 'sensitive')
   * @returns {Promise<ModResult>} Moderation result containing action and analysis
   * @throws {Error} If moderation fails
   */
  async moderateMessage(content, channelId, userId, channelType = 'normal') {
    return this.request('/moderation/moderate', {
      method: 'POST',
      data: {
        content,
        channelId,
        userId,
        channelType
      }
    });
  }

  /**
   * Stores a chat message in GalaxyGuard's database.
   * @async
   * @param {ChatMessage} message - Chat message object to store
   * @returns {Promise<ChatMessage>} Stored message with additional metadata
   * @throws {Error} If message storage fails
   */
  async storeMessage(message) {
    return this.request('/chat/messages', {
      method: 'POST',
      data: {
        content: message.content,
        username: message.username,
        userId: message.userId,
        channelName: message.channelName,
        channelId: message.channelId,
        messageType: message.type,
        badges: message.badges,
        emotes: message.emotes,
        platform: 'twitch',
        raw: message
      }
    });
  }

  /**
   * Retrieves chat messages for a specific channel.
   * @async
   * @param {string} channelId - Channel ID to retrieve messages for
   * @param {MessageOptions} [options={}] - Options for message retrieval
   * @returns {Promise<Array<ChatMessage>>} Array of chat messages
   * @throws {Error} If message retrieval fails
   */
  async getChannelMessages(channelId, options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 100,
      skip: options.skip || 0,
      startDate: options.startDate,
      endDate: options.endDate,
      moderatedOnly: options.moderatedOnly
    });

    return this.request(`/chat/channels/${channelId}/messages?${params}`);
  }
}

/**
 * Simple error logging function
 * @param {Object} errorData - Error data to log
 */
function logError(errorData) {
  console.error('GalaxyGuard Error:', errorData);
}

/**
 * Error handler for moderation failures.
 * @param {Error} error - The error that occurred
 * @param {ChatMessage} message - The message that failed moderation
 * @returns {ModResult} Fallback moderation result
 */
function handleModerationError(error, message) {
  console.error('Moderation error:', error);

  // Log the error for investigation
  logError({
    type: 'moderation_error',
    error: error.message,
    messageId: message.id,
    timestamp: new Date()
  });

  // Return fallback moderation result
  return {
    action: 'REVIEW',
    error: true
  };
}

// Create singleton instances
const tokenManager = new GalaxyGuardTokenManager();
const galaxyGuard = new GalaxyGuardClient(tokenManager);

export {
  galaxyGuard as default,
  GalaxyGuardClient,
  GalaxyGuardTokenManager,
  handleModerationError
};
