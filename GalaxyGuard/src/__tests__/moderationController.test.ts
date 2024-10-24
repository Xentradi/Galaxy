import request from 'supertest';
import express from 'express';
import router from '../routes';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = express();
app.use(express.json());
app.use('/', router);

describe('POST /moderate', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv, OPENAI_API_KEY: 'test-api-key'};
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
  });

  it('should handle invalid input', async () => {
    const response = await request(app)
      .post('/moderate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing message in request body');
  });

  it('should handle missing API key', async () => {
    delete process.env.OPENAI_API_KEY;

    const response = await request(app)
      .post('/moderate')
      .send({message: 'Test message'});

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('OpenAI API key is not set');
  });

  it('should handle API errors', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    const response = await request(app)
      .post('/moderate')
      .send({message: 'Test message'});

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('An unexpected error occurred while moderating the message');
    expect(response.body.details).toBe('API Error');
  });
});
