# Deployify

A comprehensive deployment orchestration platform that automates the build and deployment of web applications to multiple cloud providers.

## Features

- **Multi-Provider Deployment**: Support for Netlify, Vercel, DigitalOcean App Platform, and AWS Amplify
- **Smart Stack Detection**: Automatically detects project type and chooses optimal provider
- **Real-time Logs**: Live deployment logs via Server-Sent Events
- **Containerized Builds**: Isolated Docker builds for security and consistency
- **Queue Management**: BullMQ-powered job queuing with Redis
- **Modern UI**: React with TypeScript, Tailwind CSS, and shadcn/ui components

## Architecture

### Backend (NestJS)
- **API Server**: RESTful endpoints for deployment management
- **Worker Queue**: Background job processing with BullMQ
- **Provider Services**: Modular connectors for each deployment platform
- **Container Service**: Docker-based build isolation
- **Database**: PostgreSQL for deployment history and metadata

### Frontend (React)
- **Real-time Dashboard**: Live deployment monitoring
- **Provider Management**: Configure API keys and settings
- **Deployment History**: Paginated history with filtering
- **Stack Detection**: Visual provider selection matrix

## Quick Start

### Prerequisites
- Node.js 18+ (or Bun)
- Docker Desktop
- PostgreSQL 14+
- Redis 6+

### Backend Setup

1. **Environment Configuration**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/deployify
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Provider API Keys (optional - configure via UI later)
   NETLIFY_ACCESS_TOKEN=your-netlify-token
   VERCEL_TOKEN=your-vercel-token
   DO_TOKEN=your-digitalocean-token
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Services**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Run database migrations
   npm run migration:run
   
   # Start development server
   npm run start:dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   # From project root
   npm install
   # or
   bun install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

## Usage

### Basic Deployment

1. **Navigate to Features Page**
   - Click the "Deploy Now" button
   - Enter your GitHub repository URL
   - Choose deployment options

2. **Monitor Progress**
   - Watch real-time build logs
   - Track deployment status
   - Access deployed application URL

3. **Manage Deployments**
   - View deployment history in Deployments page
   - Filter by provider or status
   - Cancel running deployments

## License

MIT License - see [LICENSE](LICENSE) file for details.
