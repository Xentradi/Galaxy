import dotenv from 'dotenv';
import databaseConfig, {DatabaseConfig} from '../config/database.config';

jest.mock('dotenv');
const mockedDotenv = dotenv as jest.Mocked<typeof dotenv>;

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv};
    mockedDotenv.config.mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should use environment MONGODB_URI when provided', () => {
    const testUri = 'mongodb://test-server:27017/test-db';
    process.env.MONGODB_URI = testUri;

    // Re-import to get fresh config with new env
    jest.isolateModules(() => {
      const config = require('../config/database.config').default;
      expect(config.uri).toBe(testUri);
    });
  });

  it('should fall back to default MongoDB URI when environment variable is not set', () => {
    delete process.env.MONGODB_URI;

    jest.isolateModules(() => {
      const config = require('../config/database.config').default;
      expect(config.uri).toBe('mongodb://localhost:27017/galaxyguard');
    });
  });

  it('should have correct MongoDB connection options', () => {
    const expectedOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };

    expect(databaseConfig.options).toEqual(expectedOptions);
  });

  it('should have valid DatabaseConfig interface implementation', () => {
    const config: DatabaseConfig = databaseConfig;

    expect(config).toHaveProperty('uri');
    expect(typeof config.uri).toBe('string');
    expect(config).toHaveProperty('options');
    expect(config.options).toHaveProperty('useNewUrlParser');
    expect(config.options).toHaveProperty('useUnifiedTopology');
    expect(typeof config.options.useNewUrlParser).toBe('boolean');
    expect(typeof config.options.useUnifiedTopology).toBe('boolean');
  });

  it('should load environment variables using dotenv', () => {
    expect(mockedDotenv.config).toHaveBeenCalled();
  });
});
