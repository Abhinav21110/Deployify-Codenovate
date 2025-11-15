// Deployment request and response types
export interface DeploymentRequest {
  repoUrl: string;
  branch?: string;
  environment: 'school' | 'staging' | 'prod';
  budget: 'free' | 'low' | 'any';
  preferProviders?: string[];
}

export interface DeploymentResponse {
  deploymentId: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'queued' | 'cloning' | 'detecting' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';
  provider?: string;
  url?: string;
  detected?: DetectedStack;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface DetectedStack {
  type: 'static' | 'spa' | 'ssr' | 'api' | 'fullstack' | 'container';
  framework: string;
  buildCmd?: string;
  distDir?: string;
  portHint?: number;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  nodeVersion?: string;
  hasDockerfile: boolean;
  dependencies?: Record<string, string>;
}

export interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  deploymentId: string;
}

export interface DeploymentListQuery {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
}

export interface DeploymentListResponse {
  deployments: DeploymentStatus[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Provider interfaces
export interface ProviderConfig {
  name: string;
  type: 'static' | 'container' | 'serverless';
  costTier: 'free' | 'low' | 'medium' | 'high';
  supportsEnvironments: ('school' | 'staging' | 'prod')[];
  maxBuildTime: number; // minutes
  frameworks: string[];
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  metadata?: Record<string, any>;
}