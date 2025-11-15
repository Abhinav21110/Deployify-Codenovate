import { z } from 'zod';

// TypeScript interfaces matching backend types
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
  createdAt: string;
  updatedAt: string;
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

export interface DeploymentListResponse {
  deployments: DeploymentStatus[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Validation schemas
export const deploymentRequestSchema = z.object({
  repoUrl: z.string().url().refine(
    (url) => url.startsWith('https://github.com/'),
    { message: 'Repository URL must be a valid GitHub repository' }
  ),
  branch: z.string().optional().default('main'),
  environment: z.enum(['school', 'staging', 'prod']),
  budget: z.enum(['free', 'low', 'any']),
  preferProviders: z.array(z.string()).optional(),
});

// API client class
class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Deployment endpoints
  async createDeployment(data: DeploymentRequest): Promise<DeploymentResponse> {
    return this.request<DeploymentResponse>('/deploy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeploymentStatus(id: string): Promise<DeploymentStatus> {
    return this.request<DeploymentStatus>(`/deploy/${id}/status`);
  }

  async cancelDeployment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/deploy/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getDeployments(
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; provider?: string }
  ): Promise<DeploymentListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request<DeploymentListResponse>(`/deploy?${params}`);
  }

  // Server-Sent Events for logs
  createLogStream(deploymentId: string): EventSource {
    const url = `${this.baseURL}/deploy/${deploymentId}/logs/sse`;
    return new EventSource(url);
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// React Query keys
export const queryKeys = {
  deployment: (id: string) => ['deployment', id] as const,
  deployments: (page: number, filters?: any) => ['deployments', page, filters] as const,
  health: () => ['health'] as const,
};

// Custom hooks for React Query
export const useCreateDeployment = () => {
  return (data: DeploymentRequest) => apiClient.createDeployment(data);
};

export const useDeploymentStatus = (id: string) => {
  return () => apiClient.getDeploymentStatus(id);
};

export const useDeployments = (page: number = 1, filters?: any) => {
  return () => apiClient.getDeployments(page, 20, filters);
};