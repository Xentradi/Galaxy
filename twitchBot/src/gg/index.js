import axios from 'axios';
import {TokenManager} from './tokenManager.js';
import {MessageService} from './services/messageService.js';
import {validateConfig} from './utils/validation.js';
import {Mode} from './types.js';

/**
 * Main GalaxyGuard client class
 */
export class GalaxyGuard {
  /**
   * Creates a new GalaxyGuard client instance
   * @param {ClientConfig} config - Client configuration
   */
  constructor(config) {
    validateConfig(config);

    this.config = config;
    this.mode = config.mode || Mode.MODERATE;

    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Initialize token manager
    this.tokenManager = new TokenManager(config);

    // Add token interceptor
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Initialize services
    this.messages = new MessageService(this);
  }

  /**
   * Changes the operation mode
   * @param {'moderate' | 'log'} mode - New mode
   */
  setMode(mode) {
    if (!Object.values(Mode).includes(mode)) {
      throw new ValidationError(
        `Invalid mode: ${mode}. Must be one of: ${Object.values(Mode).join(', ')}`
      );
    }
    this.mode = mode;
  }
}

// Export types and constants
export * from './types.js';
export * from './errors.js';
export {withRetry, makeRetryable} from './utils/retry.js';
