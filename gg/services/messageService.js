import {BaseService} from './baseService.js';
import {ValidationError} from '../errors.js';
import {Mode} from '../types.js';

/**
 * Service for handling message-related operations
 */
export class MessageService extends BaseService {
  /**
   * Handles a message based on the configured mode
   * @param {Message} message - Message data
   * @param {Channel} channel - Channel data
   * @returns {Promise<MessageResponse>}
   */
  async handleMessage(message, channel) {
    this.validateRequired(message, ['content', 'channelType']);
    this.validateRequired(channel, ['id']);

    const endpoint = this.client.mode === Mode.MODERATE
      ? '/chat-moderation'
      : '/messages';

    return this.request({
      method: 'POST',
      url: endpoint,
      data: {
        content: message.content,
        channelType: message.channelType,
        channelId: channel.id,
        userId: message.userId,
        username: message.username
      }
    });
  }

  /**
   * Retrieves messages for a channel
   * @param {string} channelId - Channel identifier
   * @param {PaginationOptions} [options] - Pagination options
   * @returns {Promise<PaginatedResponse>}
   */
  async getChannelMessages(channelId, options = {}) {
    if (!channelId) {
      throw new ValidationError('Channel ID is required');
    }

    return this.request({
      method: 'GET',
      url: `/channels/${channelId}/messages`,
      params: {
        limit: options.limit,
        before: options.before,
        after: options.after
      }
    });
  }

  /**
   * Updates moderation status for a message
   * @param {string} messageId - Message identifier
   * @param {ModerationUpdate} moderationData - Moderation update data
   * @returns {Promise<MessageResponse>}
   */
  async updateModeration(messageId, moderationData) {
    if (!messageId) {
      throw new ValidationError('Message ID is required');
    }

    this.validateRequired(moderationData, ['action', 'reason', 'moderatorId']);

    return this.request({
      method: 'PATCH',
      url: `/messages/${messageId}/moderation`,
      data: moderationData
    });
  }
}
