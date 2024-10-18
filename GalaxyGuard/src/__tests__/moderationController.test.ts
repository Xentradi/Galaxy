import request from 'supertest';
import express from 'express';
import router from '../routes';

const app = express();
app.use(express.json());
app.use('/', router);

describe('POST /moderate', () => {
  it('should return a default action of allow for a safe message', async () => {
    const response = await request(app)
      .post('/moderate')
      .send({message: 'This is a safe message'});

    expect(response.status).toBe(200);
    expect(response.body.action).toBe('allow');
  });

  // Additional tests can be added here for different scenarios
});
