import request from 'supertest';
import express from 'express';
import router from '../routes';
import axios from 'axios';
import config from '../config/moderation.config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the config
jest.mock('../config/moderation.config', () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    moderationUrl: 'https://api.openai.com/v1/moderations'
  },
  thresholds: {
    individual: {
      ban: 0.9,
      mute: 0.7,
      delete: 0.5,
      warn: 0.3
    },
    cumulative: {
      ban: 0.7,
      mute: 0.5,
      delete: 0.3,
      warn: 0.2
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/', router);

describe('Moderation Controller', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv, OPENAI_API_KEY: 'test-api-key'};
    config.openai.apiKey = process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    jest.resetAllMocks();
    process.env = originalEnv;
  });

  describe('Individual Score Thresholds', () => {
    it('should return allow for a completely safe message', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: false,
          categories: {sexual: false, hate: false, violence: false},
          category_scores: {sexual: 0.01, hate: 0.01, violence: 0.01}
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'This is a safe message'});

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('allow');
      expect(response.body.details.flagged).toBe(false);
      expect(response.body.highestSeverity).toBeLessThan(config.thresholds.individual.warn);
    });

    it('should return warn for content just above warn threshold', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: true,
          categories: {hate: true},
          category_scores: {hate: config.thresholds.individual.warn + 0.01}
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Borderline warning content'});

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('warn');
      expect(response.body.highestCategory).toBe('hate');
    });

    it('should return delete for moderate violations', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: true,
          categories: {violence: true},
          category_scores: {violence: config.thresholds.individual.delete + 0.01}
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Content requiring deletion'});

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('delete');
    });
  });

  describe('Cumulative Score Thresholds', () => {
    it('should trigger action based on cumulative score even with low individual scores', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: true,
          categories: {
            sexual: true,
            hate: true,
            violence: true
          },
          category_scores: {
            sexual: 0.25,
            hate: 0.25,
            violence: 0.25
          }
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Multiple low-severity violations'});

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('mute');
      expect(response.body.cumulativeScore).toBeGreaterThan(config.thresholds.cumulative.mute);
    });
  });

  describe('Input Validation', () => {
    it('should reject empty messages', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({message: ''});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or missing message');
    });

    it('should reject non-string messages', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({message: 123});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or missing message');
    });

    it('should reject missing message field', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or missing message');
    });
  });

  describe('API Error Handling', () => {
    it('should handle missing API key', async () => {
      config.openai.apiKey = undefined;

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('OpenAI API key is not configured');
    });

    it('should handle invalid API key', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: 'Invalid API key'
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('OpenAI API request failed');
    });

    it('should handle rate limit errors', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 429,
          data: 'Rate limit exceeded'
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('OpenAI API request failed');
    });

    it('should handle OpenAI API server errors', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          data: 'Internal server error'
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('OpenAI API request failed');
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('An unexpected error occurred while moderating the message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty category scores', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: false,
          categories: {},
          category_scores: {}
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('allow');
      expect(response.body.cumulativeScore).toBe(0);
    });

    it('should handle malformed API response', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: true
          // Missing categories and category_scores
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('An unexpected error occurred while moderating the message');
    });

    it('should handle extremely high scores', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          flagged: true,
          categories: {hate: true},
          category_scores: {hate: 999999}
        }
      });

      const response = await request(app)
        .post('/moderate')
        .send({message: 'Test message'});

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('ban');
    });
  });
});
