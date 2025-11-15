# Deployify

A modern deployment platform with separate frontend and backend for deploying GitHub repositories to Netlify and Vercel.

## Features

- **Multi-Provider Support**: Deploy to Netlify and Vercel
- **Two Deployment Modes**:
  - **Drag & Drop**: Upload prebuilt static files (build/dist/public folders)
  - **Git Import**: Let providers build your project from source
- **Repository Inspection**: Automatically detect prebuilt folders
- **Real-time UI**: Modern React frontend with live deployment status
- **Clean Architecture**: Separate frontend and backend services
- **No Local Builds**: All processing happens on the server or provider-side

## Architecture

### Backend (`deployify-backend/`)
- **Express API**: RESTful endpoints for repo inspection and deployment
- **Git Operations**: Shallow cloning with simple-git
- **Provider Integration**: Netlify and Vercel API clients
- **File Processing**: Zip creation for drag-and-drop deployments
- **Minimal Dependencies**: No rate limiting, retries, or complex features

### Frontend (React + TypeScript)
- **Modern UI**: Built with React, TypeScript, Tailwind CSS, and shadcn/ui
- **Repository Inspection**: Check for prebuilt folders before deployment
- **Provider Selection**: Choose between Netlify and Vercel
- **Deployment Modes**: Drag & drop or Git import options
- **Real-time Feedback**: Live deployment status and error handling

## Quick Start

### Prerequisites
- Node.js 18+
- Netlify and/or Vercel accounts with API tokens

### Backend Setup

1. **Navigate to Backend**
   ```bash
   cd deployify-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API tokens
   ```

4. **Get API Tokens**
   - **Netlify**: https://app.netlify.com/user/applications#personal-access-tokens
   - **Vercel**: https://vercel.com/account/tokens

5. **Start Backend Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to Project Root**
   ```bash
   cd ..  # if you're in deployify-backend/
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Start Frontend Server**
   ```bash
   npm run dev
   ```

### Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

## Usage

### Deploy from Git Repository

1. **Navigate to Features Page**
   - Click "Get Started" or "Explore Features"
   - Choose from sample repositories or enter your own Git URL

2. **Enter Repository Details**
   - Git Repository URL (GitHub, GitLab, Bitbucket)
   - Optional: Custom site name
   - Click "Deploy to Netlify"

3. **Monitor Deployment**
   - Watch real-time deployment progress
   - Get live URL once deployment completes
   - View deployment logs in the bottom-right panel

### Supported Repository Types

- Static websites (HTML, CSS, JS)
- React applications
- Vue.js applications
- Next.js applications
- Documentation sites (Docusaurus, etc.)
- Any static site generator output

## API Endpoints

### POST /deploy-from-git
Deploy a Git repository to Netlify.

**Request:**
```json
{
  "gitUrl": "https://github.com/username/repository.git",
  "siteName": "my-site" // optional
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "uuid",
  "netlifyUrl": "https://site-name.netlify.app",
  "deployUrl": "https://deploy-id--site-name.netlify.app",
  "siteName": "site-name"
}
```

### GET /health
Health check endpoint.

## Environment Variables

### Backend (.env.local)
```env
PORT=3001
NETLIFY_ACCESS_TOKEN=your_netlify_access_token_here
TEMP_DIR=./temp
```

## How It Works

1. **Repository Cloning**: Server clones the Git repository to a temporary directory
2. **File Processing**: Creates a zip file excluding .git, node_modules, and other unnecessary files
3. **Netlify Deployment**: Uploads the zip file directly to Netlify via their API
4. **URL Generation**: Returns the live site URL and deployment details
5. **Cleanup**: Automatically removes temporary files and directories

## Security Features

- Temporary file isolation
- Automatic cleanup of cloned repositories
- No persistent storage of user code
- Secure API token handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.