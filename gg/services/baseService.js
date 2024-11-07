import {createError} from '../errors.js';

/**
 * Base service class with common functionality for all services
 */
export class BaseService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Makes an HTTP request with error handling
   * @param {Object} config - Axios request config
   * @returns {Promise<any>}
   * @throws {GalaxyGuardError}
   */
  async request(config) {
    try {
      const response = await this.client.axiosInstance.request(config);
      return response.data;
    } catch (error) {
      throw createError(error);
    }
  }

  /**
   * Validates required parameters
   * @param {Object} params - Parameters to validate
   * @param {Array<string>} required - Required parameter names
   * @throws {ValidationError}
   */
  validateRequired(params, required) {
    const missing = required.filter(param => !params[param]);
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required parameters: ${missing.join(', ')}`
      );
    }
  }
}
