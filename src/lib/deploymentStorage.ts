interface Deployment {
  id: string;
  gitUrl: string;
  siteName?: string;
  netlifyUrl?: string;
  deployUrl?: string;
  status: 'success' | 'failed' | 'deploying' | 'running';
  createdAt: string;
  error?: string;
  provider?: string;
}

const STORAGE_KEY = 'deployify-deployments';

export const deploymentStorage = {
  // Get all deployments from localStorage
  getDeployments(): Deployment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter(d => d && d.id && d.gitUrl) : [];
      }
      return [];
    } catch (err) {
      console.error('Error loading deployments from localStorage:', err);
      return [];
    }
  },

  // Add a new deployment
  addDeployment(deploymentData: any): Deployment {
    const newDeployment: Deployment = {
      id: deploymentData.deploymentId,
      gitUrl: deploymentData.gitUrl || 'Unknown',
      siteName: deploymentData.siteName || deploymentData.provider,
      netlifyUrl: deploymentData.siteUrl,
      deployUrl: deploymentData.siteUrl,
      status: this.mapStatus(deploymentData.status, deploymentData.provider),
      createdAt: new Date().toISOString(),
      provider: deploymentData.provider
    };

    const existingDeployments = this.getDeployments();
    const updatedDeployments = [newDeployment, ...existingDeployments];
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDeployments));
    } catch (err) {
      console.error('Failed to save deployment to localStorage:', err);
    }

    return newDeployment;
  },

  // Remove a deployment
  removeDeployment(id: string): void {
    const deployments = this.getDeployments();
    const updatedDeployments = deployments.filter(d => d.id !== id);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDeployments));
    } catch (err) {
      console.error('Failed to remove deployment from localStorage:', err);
    }
  },

  // Update deployment status
  updateDeploymentStatus(id: string, status: Deployment['status']): void {
    const deployments = this.getDeployments();
    const updatedDeployments = deployments.map(d => 
      d.id === id ? { ...d, status } : d
    );
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDeployments));
    } catch (err) {
      console.error('Failed to update deployment status:', err);
    }
  },

  // Map backend status to UI status
  mapStatus(backendStatus: string, provider: string): Deployment['status'] {
    if (provider === 'docker') {
      return backendStatus === 'running' ? 'running' : 'success';
    }
    
    switch (backendStatus) {
      case 'created':
      case 'deployed':
        return 'success';
      case 'deploying':
      case 'building':
        return 'deploying';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'success';
    }
  }
};

export type { Deployment };