/**
 * Base error class for GalaxyGuard SDK
 */
export class GalaxyGuardError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GalaxyGuardError';
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends GalaxyGuardError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends GalaxyGuardError {
  constructor(message = 'Rate limit exceeded', resetTime) {
    super(message);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
}

/**
 * Invalid request errors
 */
export class ValidationError extends GalaxyGuardError {
  constructor(message = 'Invalid request', details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Network related errors
 */
export class NetworkError extends GalaxyGuardError {
  constructor(message = 'Network error occurred', originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * API response errors
 */
export class APIError extends GalaxyGuardError {
  constructor(message = 'API error occurred', status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends GalaxyGuardError {
  constructor(message = 'Invalid configuration') {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error factory for creating appropriate error instances
 */
export function createError(error) {
  if (!error.response) {
    return new NetworkError('Network error occurred', error);
  }

  const {status, data} = error.response;

  switch (status) {
    case 401:
      return new AuthenticationError(data?.message);
    case 429:
      return new RateLimitError(
        data?.message,
        error.response.headers['x-ratelimit-reset']
      );
    case 400:
      return new ValidationError(data?.message, data?.details);
    case 402:
    case 403:
      return new AuthenticationError(data?.message);
    default:
      return new APIError(data?.message || 'Unknown error occurred', status, data);
  }
}
