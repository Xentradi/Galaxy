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

describe('POST /moderate', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv, OPENAI_API_KEY: 'test-api-key'};
    // Update config with new API key
    config.openai.apiKey = process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    jest.resetAllMocks();
    process.env = originalEnv;
  });

  it('should return a default action of allow for a safe message', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        flagged: false,
        categories: {sexual: false, hate: false, violence: false, 'self-harm': false, 'sexual/minors': false, 'hate/threatening': false, 'violence/graphic': false},
        category_scores: {sexual: 0.01, hate: 0.01, violence: 0.01, 'self-harm': 0.01, 'sexual/minors': 0.01, 'hate/threatening': 0.01, 'violence/graphic': 0.01}
      }
    });

    const response = await request(app)
      .post('/moderate')
      .send({message: 'This is a safe message'});

    expect(response.status).toBe(200);
    expect(response.body.action).toBe('allow');
    expect(response.body.details).toBeDefined();
    expect(response.body.details.flagged).toBe(false);
  });

  it('should return a warn action for a slightly unsafe message', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        flagged: true,
        categories: {sexual: false, hate: true, violence: false, 'self-harm': false, 'sexual/minors': false, 'hate/threatening': false, 'violence/graphic': false},
        category_scores: {sexual: 0.01, hate: 0.35, violence: 0.01, 'self-harm': 0.01, 'sexual/minors': 0.01, 'hate/threatening': 0.01, 'violence/graphic': 0.01}
      }
    });

    const response = await request(app)
      .post('/moderate')
      .send({message: 'This message contains mild hate speech'});

    expect(response.status).toBe(200);
    expect(response.body.action).toBe('warn');
    expect(response.body.highestCategory).toBe('hate');
  });

  it('should return a ban action for a very unsafe message', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        flagged: true,
        categories: {sexual: false, hate: true, violence: true, 'self-harm': false, 'sexual/minors': false, 'hate/threatening': true, 'violence/graphic': true},
        category_scores: {sexual: 0.01, hate: 0.95, violence: 0.92, 'self-harm': 0.01, 'sexual/minors': 0.01, 'hate/threatening': 0.93, 'violence/graphic': 0.94}
      }
    });

    const response = await request(app)
      .post('/moderate')
      .send({message: 'This message contains extreme hate speech and violence'});

    expect(response.status).toBe(200);
    expect(response.body.action).toBe('ban');
    expect(response.body.highestSeverity).toBeGreaterThanOrEqual(config.thresholds.individual.ban);
  });

  it('should handle invalid input', async () => {
    const response = await request(app)
      .post('/moderate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing message');
    expect(response.body.details).toBe('Message must be a non-empty string');
  });

  it('should handle missing API key', async () => {
    config.openai.apiKey = undefined;

    const response = await request(app)
      .post('/moderate')
      .send({message: 'Test message'});

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('OpenAI API key is not configured');
    expect(response.body.details).toBe('Please set the OPENAI_API_KEY environment variable');
  });

  it('should handle API errors', async () => {
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
    expect(response.body.details).toBe('Invalid API key');
  });
});
