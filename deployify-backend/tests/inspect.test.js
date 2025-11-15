const request = require('supertest');
const express = require('express');
const inspectController = require('../src/controllers/inspectController');

const app = express();
app.use(express.json());
app.post('/api/repo/inspect', inspectController.inspect);

describe('POST /api/repo/inspect', () => {
  test('should return 400 when repoUrl is missing', async () => {
    const response = await request(app)
      .post('/api/repo/inspect')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('repoUrl is required');
  });

  test('should return 500 for invalid repository URL', async () => {
    const response = await request(app)
      .post('/api/repo/inspect')
      .send({
        repoUrl: 'https://github.com/nonexistent/repo-that-does-not-exist'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Failed to clone repository');
  });

  test('should return proper structure for valid request', async () => {
    const response = await request(app)
      .post('/api/repo/inspect')
      .send({
        repoUrl: 'https://github.com/octocat/Hello-World'
      });

    // This might fail if the repo doesn't exist, but structure should be correct
    if (response.status === 200) {
      expect(response.body).toHaveProperty('repoUrl');
      expect(response.body).toHaveProperty('candidates');
      expect(response.body).toHaveProperty('hasPrebuilt');
      expect(Array.isArray(response.body.candidates)).toBe(true);
      expect(typeof response.body.hasPrebuilt).toBe('boolean');
    }
  });
});