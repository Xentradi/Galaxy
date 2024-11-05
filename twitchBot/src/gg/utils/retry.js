import {NetworkError, RateLimitError} from '../errors.js';

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2,
  retryableErrors: [NetworkError],
  shouldRetry: (error, attempt, config) => {
    // Don't retry if we've hit the max attempts
    if (attempt >= config.maxRetries) return false;

    // Always retry network errors
    if (error instanceof NetworkError) return true;

    // Retry rate limit errors if we have a reset time
    if (error instanceof RateLimitError && error.resetTime) {
      return true;
    }

    // Don't retry other errors
    return false;
  }
};

/**
 * Implements exponential backoff retry logic
 * @param {Function} fn - Function to retry
 * @param {Object} [options] - Retry configuration
 * @returns {Promise<any>}
 */
export async function withRetry(fn, options = {}) {
  const config = {...DEFAULT_CONFIG, ...options};
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (!config.shouldRetry(error, attempt, config)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        config.initialDelay * Math.pow(config.factor, attempt - 1),
        config.maxDelay
      );

      // If it's a rate limit error with reset time, use that instead
      if (error instanceof RateLimitError && error.resetTime) {
        const resetDelay = (new Date(error.resetTime) - new Date());
        if (resetDelay > 0) {
          delay = resetDelay;
        }
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Creates a retryable version of a function
 * @param {Function} fn - Function to make retryable
 * @param {Object} [options] - Retry configuration
 * @returns {Function}
 */
export function makeRetryable(fn, options = {}) {
  return (...args) => withRetry(() => fn(...args), options);
}
