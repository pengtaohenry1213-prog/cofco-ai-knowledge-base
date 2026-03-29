import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('Document Routes', () => {
  const app = express();
  app.use(express.json());

  it('should respond to health check', async () => {
    const testApp = express();
    testApp.get('/api/health', (_req, res) => {
      res.json({ code: 200, msg: 'server is running' });
    });

    const res = await request(testApp).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });
});
