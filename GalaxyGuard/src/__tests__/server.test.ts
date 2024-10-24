import request from 'supertest';
import express from 'express';
import router from '../routes';

describe('Server and Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Add welcome route as defined in server.ts
    app.get('/', (req, res) => {
      res.send('Welcome to the GalaxyGuard API');
    });
  });

  describe('Server Configuration', () => {
    it('should use correct port from environment variable', () => {
      const originalEnv = process.env;
      process.env.PORT = '4000';

      jest.isolateModules(() => {
        const port = require('../server').PORT;
        expect(port).toBe(4000);
      });

      process.env = originalEnv;
    });

    it('should use default port 3000 when PORT env is not set', () => {
      const originalEnv = process.env;
      delete process.env.PORT;

      jest.isolateModules(() => {
        const port = require('../server').PORT;
        expect(port).toBe(3000);
      });

      process.env = originalEnv;
    });

    it('should have JSON middleware configured', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({message: 'test'})
        .set('Content-Type', 'application/json');

      // We expect 401 because of missing API key, but not 400 which would indicate JSON parsing failed
      expect(response.status).not.toBe(400);
    });
  });

  describe('Route Configuration', () => {
    it('should respond to GET /', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Welcome to the GalaxyGuard API');
    });

    it('should have moderation endpoint configured', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({message: 'test message'});

      // We expect 401 because of missing API key, but not 404 which would indicate missing route
      expect(response.status).not.toBe(404);
    });

    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/undefined-route');

      expect(response.status).toBe(404);
    });

    it('should reject non-JSON requests to moderation endpoint', async () => {
      const response = await request(app)
        .post('/moderate')
        .send('not-json-content')
        .set('Content-Type', 'text/plain');

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/moderate')
        .set('Content-Type', 'application/json')
        .send('{malformed json}');

      expect(response.status).toBe(400);
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/moderate')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .post('/moderate')
        .send({message: 'test'});

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('trace');
    });

    it('should handle large payloads appropriately', async () => {
      const largeMessage = 'x'.repeat(1000000); // 1MB of data
      const response = await request(app)
        .post('/moderate')
        .send({message: largeMessage});

      // Should either reject with 413 (Payload Too Large) or accept it
      expect([413, 401]).toContain(response.status);
    });
  });
});
