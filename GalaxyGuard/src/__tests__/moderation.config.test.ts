import moderationConfig, {ModerationConfig} from '../config/moderation.config';

describe('Moderation Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('OpenAI Configuration', () => {
    it('should use environment OPENAI_API_KEY when provided', () => {
      const testApiKey = 'test-openai-key-123';
      process.env.OPENAI_API_KEY = testApiKey;

      jest.isolateModules(() => {
        const config = require('../config/moderation.config').default;
        expect(config.openai.apiKey).toBe(testApiKey);
      });
    });

    it('should have undefined API key when environment variable is not set', () => {
      delete process.env.OPENAI_API_KEY;

      jest.isolateModules(() => {
        const config = require('../config/moderation.config').default;
        expect(config.openai.apiKey).toBeUndefined();
      });
    });

    it('should have correct OpenAI moderation URL', () => {
      expect(moderationConfig.openai.moderationUrl).toBe('https://api.openai.com/v1/moderations');
    });
  });

  describe('Default Thresholds', () => {
    it('should have correct individual threshold values', () => {
      const expectedThresholds = {
        ban: 0.9,
        mute: 0.7,
        delete: 0.5,
        warn: 0.3
      };

      expect(moderationConfig.defaultThresholds.individual).toEqual(expectedThresholds);
    });

    it('should have correct cumulative threshold values', () => {
      const expectedThresholds = {
        ban: 0.7,
        mute: 0.5,
        delete: 0.3,
        warn: 0.2
      };

      expect(moderationConfig.defaultThresholds.cumulative).toEqual(expectedThresholds);
    });

    it('should maintain threshold hierarchy in individual category', () => {
      const {individual} = moderationConfig.defaultThresholds;

      expect(individual.ban).toBeGreaterThan(individual.mute);
      expect(individual.mute).toBeGreaterThan(individual.delete);
      expect(individual.delete).toBeGreaterThan(individual.warn);
    });

    it('should maintain threshold hierarchy in cumulative category', () => {
      const {cumulative} = moderationConfig.defaultThresholds;

      expect(cumulative.ban).toBeGreaterThan(cumulative.mute);
      expect(cumulative.mute).toBeGreaterThan(cumulative.delete);
      expect(cumulative.delete).toBeGreaterThan(cumulative.warn);
    });
  });

  describe('Type Safety', () => {
    it('should have valid ModerationConfig interface implementation', () => {
      const config: ModerationConfig = moderationConfig;

      // Check openai configuration
      expect(config.openai).toBeDefined();
      expect(config.openai).toHaveProperty('moderationUrl');
      expect(typeof config.openai.moderationUrl).toBe('string');

      // Check thresholds structure
      expect(config.defaultThresholds).toBeDefined();
      expect(config.defaultThresholds).toHaveProperty('individual');
      expect(config.defaultThresholds).toHaveProperty('cumulative');

      // Check individual thresholds
      const {individual} = config.defaultThresholds;
      expect(individual).toHaveProperty('ban');
      expect(individual).toHaveProperty('mute');
      expect(individual).toHaveProperty('delete');
      expect(individual).toHaveProperty('warn');
      expect(typeof individual.ban).toBe('number');
      expect(typeof individual.mute).toBe('number');
      expect(typeof individual.delete).toBe('number');
      expect(typeof individual.warn).toBe('number');

      // Check cumulative thresholds
      const {cumulative} = config.defaultThresholds;
      expect(cumulative).toHaveProperty('ban');
      expect(cumulative).toHaveProperty('mute');
      expect(cumulative).toHaveProperty('delete');
      expect(cumulative).toHaveProperty('warn');
      expect(typeof cumulative.ban).toBe('number');
      expect(typeof cumulative.mute).toBe('number');
      expect(typeof cumulative.delete).toBe('number');
      expect(typeof cumulative.warn).toBe('number');
    });

    it('should have all threshold values between 0 and 1', () => {
      const {individual, cumulative} = moderationConfig.defaultThresholds;

      // Check individual thresholds
      Object.values(individual).forEach(value => {
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(1);
      });

      // Check cumulative thresholds
      Object.values(cumulative).forEach(value => {
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });
});
