# Deployify Backend

Minimal Node.js Express backend for Netlify drag-and-drop and Vercel Git import deployments.

## Features

- **Netlify drag-and-drop**: Zip prebuilt static folders and upload to Netlify
- **Vercel Git import**: Trigger provider-side builds by importing public GitHub repos
- No local builds - only handles existing artifacts or provider-side builds
- Simple, synchronous-like flows with async/await

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=4000
NETLIFY_AUTH_TOKEN=your_netlify_personal_token_here
VERCEL_TOKEN=your_vercel_personal_token_here
TEMP_DIR=/tmp/deployify
```

### Getting API Tokens

**Netlify Token:**
1. Go to https://app.netlify.com/user/applications#personal-access-tokens
2. Generate a new access token
3. Copy the token to your `.env` file

**Vercel Token:**
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Copy the token to your `.env` file

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Tests
```bash
npm test
```

## API Endpoints

### POST /api/repo/inspect

Inspect a repository for prebuilt folders.

**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "branch": "main"
}
```

**Response:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "candidates": ["build", "dist"],
  "hasPrebuilt": true
}
```

### POST /api/deploy

Deploy a repository to Netlify or Vercel.

**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "provider": "netlify",
  "deployMode": "drag-drop",
  "branch": "main",
  "buildDir": "build"
}
```

**Response (Netlify drag-drop):**
```json
{
  "provider": "netlify",
  "site_url": "https://site-name.netlify.app",
  "deploy_id": "uuid",
  "status": "created"
}
```

**Response (Vercel git-import):**
```json
{
  "provider": "vercel",
  "project_id": "project_id",
  "deployment_url": "https://project.vercel.app",
  "status": "created"
}
```

### GET /api/deploy/status/:id

Get deployment status.

**Response:**
```json
{
  "id": "deployment_id",
  "provider": "netlify",
  "status": "created",
  "error": null
}
```

## Sample cURL Commands

### Inspect Repository
```bash
curl -X POST http://localhost:4000/api/repo/inspect \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/owner/repo"}'
```

### Deploy to Netlify (drag-drop)
```bash
curl -X POST http://localhost:4000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl":"https://github.com/owner/prebuilt-repo",
    "provider":"netlify",
    "deployMode":"drag-drop"
  }'
```

### Deploy to Netlify (git-import)
```bash
curl -X POST http://localhost:4000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl":"https://github.com/owner/repo",
    "provider":"netlify",
    "deployMode":"git-import"
  }'
```

### Deploy to Vercel (git-import)
```bash
curl -X POST http://localhost:4000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl":"https://github.com/owner/repo",
    "provider":"vercel",
    "deployMode":"git-import"
  }'
```

### Check Deployment Status
```bash
curl http://localhost:4000/api/deploy/status/deployment_id
```

## Supported Deployment Modes

| Provider | Mode | Description |
|----------|------|-------------|
| Netlify | drag-drop | Upload prebuilt static files (build/dist/public) |
| Netlify | git-import | Create site linked to GitHub repo |
| Vercel | git-import | Import project from GitHub repo |

## Error Handling

- **400**: Bad request (missing parameters, invalid repo URL, no prebuilt folder)
- **404**: Deployment not found
- **500**: Server error (API failures, network issues)

All error responses include an `error` field with a descriptive message.