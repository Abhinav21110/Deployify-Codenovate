# Deployify

🚀 **AI-Powered Intelligent Deployment System** - Smart, scalable, and seriously simple deployment platform with multi-provider support, AI analysis, and local containerization.

## ✨ Features

### 🌐 **Multi-Provider Support**
- **Netlify**: Static sites and JAMstack applications
- **Vercel**: Next.js and React applications with auto-deployment
- **AWS S3**: Scalable cloud hosting with automatic bucket configuration
- **Docker**: Local full-stack containerization

### 🤖 **AI-Powered Analysis**
- **Repository Summarization**: AI analysis of project structure and tech stack
- **Smart Recommendations**: Intelligent provider and deployment mode suggestions
- **Tech Stack Detection**: Automatic framework, language, and build tool identification
- **Deployment Optimization**: AI-driven configuration recommendations

### 🚀 **Deployment Modes**
- **Drag & Drop**: Upload prebuilt static files (build/dist/public folders)
- **Git Import**: Let providers build your project from source
- **Docker Local**: Full-stack containerization with automatic Dockerfile generation

### 🔍 **Advanced Repository Features**
- **Repository Inspection**: Automatically detect prebuilt folders and project structure
- **Build Detection**: Smart detection of Node.js projects with automatic building
- **Multi-Framework Support**: React, Vue, Next.js, Angular, and more
- **Real-time Logs**: Live deployment progress and container management

### 💎 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful blur effects and modern aesthetics
- **Responsive Layout**: Mobile-first design with adaptive components
- **Real-time Feedback**: Live deployment status and interactive notifications
- **User Feedback System**: Post-deployment feedback collection and analytics
- **Authentication System**: Route protection and credential management

## 🏗️ Architecture

### Backend (`deployify-backend/`)
- **Express API**: RESTful endpoints for repo inspection, deployment, and feedback
- **Git Operations**: Shallow cloning with simple-git and automatic cleanup
- **Multi-Provider Integration**: Netlify, Vercel, AWS S3, and Docker support
- **AI Integration**: Gemini AI for repository analysis and recommendations
- **File Processing**: Zip creation, build automation, and Docker containerization
- **Feedback System**: User feedback collection and analytics endpoints
- **Container Management**: Docker container lifecycle management

### Frontend (React + TypeScript + Vite)
- **Modern Stack**: React 18, TypeScript, Tailwind CSS, and shadcn/ui
- **Glass Morphism UI**: Beautiful blur effects and modern design system
- **Font System**: Inter (body text) and Space Grotesk (headings) with system fallbacks
- **Repository Tools**: Inspection, AI analysis, and deployment wizards
- **Provider Management**: Multi-provider selection with smart recommendations
- **Real-time Features**: Live logs, deployment status, and feedback modals
- **Authentication**: Route protection and credential management system

## Quick Start

### Prerequisites
- **Node.js 18+**
- **Docker** (for local containerization)
- **API Tokens** (optional but recommended):
  - Netlify Personal Access Token
  - Vercel API Token
  - AWS Credentials (for S3 deployment)
  - Gemini AI API Key (for repository analysis)

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

4. **Get API Tokens** (Optional)
   - **Netlify**: https://app.netlify.com/user/applications#personal-access-tokens
   - **Vercel**: https://vercel.com/account/tokens
   - **AWS**: Configure AWS credentials for S3 deployment
   - **Gemini AI**: https://makersuite.google.com/app/apikey

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
- **Frontend**: http://localhost:8080 (Vite dev server)
- **Backend API**: http://localhost:4000
- **Docker Containers**: Various ports (automatically assigned)

## 🚀 Usage

### 1. **Authentication**
- Navigate to the Auth page
- Sign up or log in to access deployment features
- Credentials are stored locally for session management

### 2. **Repository Analysis**
1. **Enter Repository URL**: GitHub repository URL
2. **Inspect Repository**: Detect prebuilt folders and project structure
3. **AI Analysis**: Get intelligent recommendations for deployment
   - Tech stack detection (React, Vue, Next.js, etc.)
   - Build configuration analysis
   - Provider recommendations
   - Potential issues identification

### 3. **Deployment Options**

#### 🌐 **Netlify Deployment**
- **Drag & Drop**: Upload prebuilt static files
- **Git Import**: Automatic building from source
- Best for: Static sites, JAMstack applications

#### ▲ **Vercel Deployment**
- **Git Import**: Automatic building with GitHub integration
- **Auto-deployment**: Continuous deployment on git push
- Best for: Next.js, React applications

#### ☁️ **AWS S3 Deployment**
- **Static Hosting**: Automatic S3 bucket creation and configuration
- **Scalable**: Cloud-based hosting with global CDN
- Best for: High-traffic static websites

#### 🐳 **Docker Local Deployment**
- **Full-Stack**: Complete application containerization
- **Local Development**: Run entire stack in Docker containers
- **Automatic Dockerfile**: Generated based on project structure
- Best for: Full-stack applications, local development

### 4. **Deployment Management**
- **Real-time Logs**: Monitor deployment progress
- **Container Management**: Start/stop Docker containers
- **Deployment History**: Track all deployments in the Deployments page
- **Feedback System**: Provide feedback after each deployment

### 🎯 **Supported Project Types**

#### **Frontend Frameworks**
- React (Create React App, Vite)
- Vue.js (Vue CLI, Nuxt.js)
- Angular
- Next.js
- Svelte/SvelteKit
- Static HTML/CSS/JS

#### **Build Tools**
- Vite
- Webpack
- Parcel
- npm/yarn scripts
- Custom build configurations

#### **Full-Stack Applications**
- Node.js + Express
- React + Node.js
- Vue + Express
- Any containerizable application

## 🔌 API Endpoints

### Repository Operations
- **POST** `/api/repo/inspect` - Analyze repository structure
- **POST** `/api/repo/summarize` - AI-powered repository analysis

### Deployment Operations
- **POST** `/api/deploy` - Deploy to any provider
- **GET** `/api/deploy/status/:id` - Get deployment status
- **GET** `/api/deploy/logs/:id` - Get deployment logs
- **POST** `/api/deploy/container/:id` - Manage Docker containers

### Feedback System
- **POST** `/api/feedback` - Submit user feedback
- **GET** `/api/feedback/analytics` - Get feedback analytics

### System
- **GET** `/health` - Health check endpoint
- **GET** `/api/logs` - System logs

### Example: Deploy Request
```json
{
  "repoUrl": "https://github.com/username/repository.git",
  "provider": "netlify|vercel|aws|docker",
  "deployMode": "drag-drop|git-import|docker-local",
  "buildDir": "build" // optional
}
```

### Example: AI Analysis Response
```json
{
  "aiAnalysis": {
    "projectOverview": "React application with TypeScript...",
    "techStack": {
      "framework": "React",
      "language": "TypeScript",
      "buildTool": "Vite",
      "packageManager": "npm"
    },
    "deploymentRecommendations": {
      "bestProvider": "vercel",
      "deployMode": "git-import",
      "reasons": ["React works well with Vercel", "..."]
    },
    "potentialIssues": ["No build script found", "..."]
  }
}
```

## ⚙️ Environment Variables

### Backend (`deployify-backend/.env`)
```env
# Server Configuration
PORT=4000
TEMP_DIR=./temp

# Provider API Tokens (Optional)
NETLIFY_AUTH_TOKEN=your_netlify_token_here
VERCEL_TOKEN=your_vercel_token_here

# AWS Configuration (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# AI Integration (Optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (`.env.local`)
```env
# Backend URL
VITE_BACKEND_URL=http://localhost:4000
```

### Docker Environment
```env
# Docker-specific configurations
DOCKER_HOST=unix:///var/run/docker.sock
```

## 🔧 How It Works

### Repository Analysis Flow
1. **Repository Cloning**: Shallow clone to temporary directory
2. **AI Analysis**: Gemini AI analyzes project structure and dependencies
3. **Tech Stack Detection**: Automatic framework and build tool identification
4. **Smart Recommendations**: AI suggests optimal deployment configuration

### Deployment Flow
1. **Provider Selection**: Choose based on project type and requirements
2. **Build Process**: Automatic npm install and build for Node.js projects
3. **Deployment Execution**:
   - **Netlify/Vercel**: API-based deployment with real-time status
   - **AWS S3**: Bucket creation and static file upload
   - **Docker**: Dockerfile generation and container creation
4. **Monitoring**: Real-time logs and deployment status tracking
5. **Cleanup**: Automatic temporary file and directory cleanup

### Docker Containerization
1. **Dockerfile Generation**: Automatic creation based on project structure
2. **Multi-stage Builds**: Optimized container images
3. **Port Management**: Automatic port assignment and mapping
4. **Container Lifecycle**: Start, stop, and status management

## 🔒 Security Features

- **Temporary File Isolation**: Sandboxed repository processing
- **Automatic Cleanup**: No persistent storage of user code
- **Secure API Handling**: Environment-based token management
- **Container Security**: Isolated Docker environments
- **Route Protection**: Authentication-based access control
- **Input Validation**: Comprehensive request validation and sanitization

## 🎨 UI/UX Features

### Design System
- **Glass Morphism**: Modern blur effects and transparency
- **Typography**: Inter (body) and Space Grotesk (headings) with system fallbacks
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Theme**: Optimized for dark mode with proper contrast

### Interactive Elements
- **Blur Reveal Animations**: Smooth scroll-based reveals
- **Glass Cards**: Beautiful translucent components
- **Hover Effects**: Enhanced interactions with smooth transitions
- **Loading States**: Skeleton screens and progress indicators

### User Experience
- **Feedback System**: Post-deployment feedback collection
- **Real-time Updates**: Live deployment progress and logs
- **Error Handling**: Graceful error states with recovery options
- **Accessibility**: WCAG compliant with keyboard navigation

## 🐳 Docker Features

### Local Development
- **Full-Stack Containers**: Complete application containerization
- **Automatic Dockerfile**: Generated based on project analysis
- **Port Management**: Automatic port assignment and conflict resolution
- **Container Lifecycle**: Start, stop, restart, and status monitoring

### Supported Architectures
- **Frontend + Backend**: React/Vue + Node.js/Express
- **Static Sites**: Nginx-based serving
- **Full-Stack Frameworks**: Next.js, Nuxt.js with SSR
- **Custom Applications**: Any containerizable project

## 📊 Analytics & Feedback

### Deployment Analytics
- **Success Rates**: Track deployment success across providers
- **Performance Metrics**: Build times and deployment duration
- **Error Tracking**: Common issues and resolution patterns
- **Provider Comparison**: Performance across different platforms

### User Feedback System
- **Rating System**: 1-5 star ratings for deployments
- **Category Feedback**: Speed, ease of use, reliability, features
- **Improvement Suggestions**: Collect user recommendations
- **Analytics Dashboard**: Aggregate feedback insights

## 🚀 Performance Optimizations

### Frontend
- **Code Splitting**: Lazy loading of components
- **Font Optimization**: Preloaded Google Fonts with fallbacks
- **Image Optimization**: Responsive images and lazy loading
- **Bundle Analysis**: Optimized build sizes

### Backend
- **Efficient Cloning**: Shallow git clones for faster processing
- **Parallel Processing**: Concurrent operations where possible
- **Memory Management**: Automatic cleanup and garbage collection
- **Caching**: Strategic caching of analysis results

## 🔧 Development

### Project Structure
```
deployify/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities and helpers
├── deployify-backend/     # Backend Express API
│   ├── src/
│   │   ├── controllers/   # API route handlers
│   │   ├── providers/     # Deployment provider integrations
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Utility functions
│   └── temp/              # Temporary file storage
└── public/                # Static assets
```

### Development Commands
```bash
# Frontend development
npm run dev              # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Backend development
cd deployify-backend
npm run dev             # Start Express server with nodemon
npm start               # Start production server

# Docker operations
docker build -t deployify .
docker run -p 3000:3000 deployify
```

## 🤝 Contributing

### Getting Started
1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies for both frontend and backend
4. **Create** a feature branch
5. **Make** your changes with tests
6. **Submit** a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

### Areas for Contribution
- New deployment providers
- UI/UX improvements
- Performance optimizations
- Additional AI analysis features
- Enhanced Docker support
- Accessibility improvements

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using React, TypeScript, Express, and AI**