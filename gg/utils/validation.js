import {ValidationError} from '../errors.js';
import {Mode, ChannelType, ModerationAction} from '../types.js';

/**
 * Validates client configuration
 * @param {ClientConfig} config - Client configuration
 * @throws {ValidationError}
 */
export function validateConfig(config) {
  const required = ['apiUrl', 'clientId', 'clientSecret'];
  const missing = required.filter(param => !config[param]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required configuration: ${missing.join(', ')}`
    );
  }

  if (config.mode && !Object.values(Mode).includes(config.mode)) {
    throw new ValidationError(
      `Invalid mode: ${config.mode}. Must be one of: ${Object.values(Mode).join(', ')}`
    );
  }
}

/**
 * Validates channel type
 * @param {string} channelType - Channel type to validate
 * @throws {ValidationError}
 */
export function validateChannelType(channelType) {
  if (!Object.values(ChannelType).includes(channelType)) {
    throw new ValidationError(
      `Invalid channel type: ${channelType}. Must be one of: ${Object.values(ChannelType).join(', ')}`
    );
  }
}

/**
 * Validates moderation action
 * @param {string} action - Action to validate
 * @throws {ValidationError}
 */
export function validateModerationAction(action) {
  if (!Object.values(ModerationAction).includes(action)) {
    throw new ValidationError(
      `Invalid moderation action: ${action}. Must be one of: ${Object.values(ModerationAction).join(', ')}`
    );
  }
}
