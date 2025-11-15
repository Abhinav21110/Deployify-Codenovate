const request = require('supertest');
const express = require('express');
const deployController = require('../src/controllers/deployController');

const app = express();
app.use(express.json());
app.post('/api/deploy', deployController.deploy);

describe('POST /api/deploy', () => {
  test('should return 400 when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/deploy')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('repoUrl, provider, and deployMode are required');
  });

  test('should return 400 for invalid provider', async () => {
    const response = await request(app)
      .post('/api/deploy')
      .send({
        repoUrl: 'https://github.com/owner/repo',
        provider: 'invalid',
        deployMode: 'drag-drop'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('provider must be netlify or vercel');
  });

  test('should return 400 for invalid deployMode', async () => {
    const response = await request(app)
      .post('/api/deploy')
      .send({
        repoUrl: 'https://github.com/owner/repo',
        provider: 'netlify',
        deployMode: 'invalid'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('deployMode must be drag-drop or git-import');
  });

  test('should return 400 when no prebuilt artifacts found for drag-drop', async () => {
    const response = await request(app)
      .post('/api/deploy')
      .send({
        repoUrl: 'https://github.com/octocat/Hello-World',
        provider: 'netlify',
        deployMode: 'drag-drop'
      });

    // This should fail because Hello-World doesn't have build artifacts
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('No prebuilt folder found');
  });
});