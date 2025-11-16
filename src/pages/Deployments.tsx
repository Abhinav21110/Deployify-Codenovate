import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Plus, RefreshCw, Search, Trash2, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedDeployModal } from '@/components/EnhancedDeployModal';
import { LogsViewer } from '@/components/LogsViewer';
import { DockerContainerManager } from '@/components/DockerContainerManager';

interface Deployment {
  id: string;
  gitUrl: string;
  siteName?: string;
  netlifyUrl?: string;
  deployUrl?: string;
  status: 'success' | 'failed' | 'deploying';
  createdAt: string;
  error?: string;
  provider?: string;
}

export default function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/health`);
      if (!response.ok) {
        throw new Error('Backend not responding');
      }
      return true;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  };



  // Load deployments immediately from localStorage (synchronous)
  useEffect(() => {
    // Use requestAnimationFrame to ensure this runs after the initial render
    const loadData = () => {
      try {
        const stored = localStorage.getItem('deployify-deployments');
        if (stored) {
          const parsed = JSON.parse(stored);
          const validDeployments = Array.isArray(parsed) ? parsed.filter(d => d && d.id && d.gitUrl) : [];
          setDeployments(validDeployments);
        }
      } catch (err) {
        console.error('Error loading deployments from localStorage:', err);
      }
      setIsInitialized(true);
    };

    // Use a small timeout to prevent any potential flickering
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check backend health separately (asynchronous)
  useEffect(() => {
    if (!isInitialized) return;
    
    let isMounted = true;
    
    const checkHealth = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        if (isMounted) {
          if (!isHealthy) {
            setError('Backend is not running. Please start the backend server.');
          } else {
            setError(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error checking backend health:', err);
          setError('Failed to connect to backend');
        }
      }
    };
    
    checkHealth();
    
    return () => {
      isMounted = false;
    };
  }, [isInitialized]);

  // Handle successful deployment
  const handleDeploymentSuccess = (deploymentData: any) => {
    console.log('Received deployment data:', deploymentData);
    
    const newDeployment: Deployment = {
      id: deploymentData.deploymentId,
      gitUrl: deploymentData.gitUrl || 'Unknown',
      siteName: deploymentData.siteName || deploymentData.provider,
      netlifyUrl: deploymentData.siteUrl,
      deployUrl: deploymentData.siteUrl,
      status: deploymentData.status === 'created' ? 'success' : 'deploying',
      createdAt: new Date().toISOString(),
      provider: deploymentData.provider
    };

    console.log('Created deployment object:', newDeployment);

    setDeployments(prevDeployments => {
      const updatedDeployments = [newDeployment, ...prevDeployments];
      // Save to localStorage
      try {
        localStorage.setItem('deployify-deployments', JSON.stringify(updatedDeployments));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
      return updatedDeployments;
    });
    
    setIsCreateModalOpen(false);
    toast.success('Deployment added to history!');
  };

  // Handle delete deployment
  const handleDeleteDeployment = (id: string) => {
    setDeployments(prevDeployments => {
      const updatedDeployments = prevDeployments.filter(d => d.id !== id);
      try {
        localStorage.setItem('deployify-deployments', JSON.stringify(updatedDeployments));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
      return updatedDeployments;
    });
    toast.success('Deployment removed');
  };

  // Filter deployments based on search (memoized to prevent unnecessary recalculations)
  const filteredDeployments = useMemo(() => {
    if (!searchTerm.trim()) return deployments;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return deployments.filter(deployment => 
      deployment.gitUrl?.toLowerCase().includes(lowerSearchTerm) ||
      deployment.siteName?.toLowerCase().includes(lowerSearchTerm) ||
      deployment.id?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [deployments, searchTerm]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'deploying':
        return <Clock className="h-4 w-4 text-blue-400 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'deploying':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen text-white pb-32 px-4">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
            <p className="text-gray-400">Loading deployments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white pb-32 px-4">
        <div className="max-w-7xl mx-auto pt-20">
          <Card className="glass-card rounded-xl p-8 max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-300">Error</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full"
            >
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-32 px-4 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Deployments
            </h1>
            <p className="text-gray-400">Manage and monitor your deployments</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsLogsModalOpen(true)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 gap-2"
            >
              <Terminal className="h-4 w-4" />
              View Logs
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full gap-2"
            >
              <Plus className="h-4 w-4" />
              New Deployment
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-card border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Deployments List */}
        <Card className="glass-card rounded-xl p-6">
          {filteredDeployments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-300">No deployments found</h3>
              <p className="text-gray-400 mb-4">Get started by creating your first deployment.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full"
              >
                Create Deployment
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredDeployments.filter(d => d && d.id).map((deployment) => (
                <Card key={deployment.id} className="glass-card card-hover rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="font-mono text-sm text-gray-300 bg-black/20 px-3 py-1 rounded-full">
                          {deployment.id ? deployment.id.slice(0, 8) : 'unknown'}
                        </div>
                        <Badge className={`gap-1 ${getStatusColor(deployment.status)} border-current/30`}>
                          {getStatusIcon(deployment.status)}
                          {deployment.status}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Repository</div>
                          <div className="font-medium text-white truncate">
                            {deployment.gitUrl ? deployment.gitUrl.replace('https://github.com/', '').replace('.git', '') : 'Unknown'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Provider</div>
                          <div className="text-white capitalize">
                            {deployment.provider || 'Netlify'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Deployed</div>
                          <div className="text-sm text-white">
                            {new Date(deployment.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDeploymentId(deployment.id);
                          setIsLogsModalOpen(true);
                        }}
                        className="glass-card border-blue-500/20 text-blue-400 hover:bg-blue-900/10"
                      >
                        <Terminal className="h-3 w-3 mr-1" />
                        Logs
                      </Button>
                      
                      {deployment.netlifyUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(deployment.netlifyUrl, '_blank')}
                          className="glass-card border-white/20 text-white hover:bg-white/10"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Site
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDeployment(deployment.id)}
                        className="glass-card border-red-500/20 text-red-400 hover:bg-red-900/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Docker Container Management */}
                  {deployment.provider === 'docker' && (
                    <div className="mt-4">
                      <DockerContainerManager
                        deploymentId={deployment.id}
                        containerName={deployment.siteName || `container-${deployment.id}`}
                        siteUrl={deployment.netlifyUrl || deployment.deployUrl || '#'}
                        initialStatus={deployment.status === 'success' ? 'running' : 'stopped'}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {filteredDeployments.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-400">
              Showing {filteredDeployments.length} deployments
            </div>
          )}
        </Card>
      </div>

      {/* Deploy Modal */}
      <EnhancedDeployModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleDeploymentSuccess}
      />

      {/* Logs Modal */}
      <LogsViewer
        isOpen={isLogsModalOpen}
        onClose={() => {
          setIsLogsModalOpen(false);
          setSelectedDeploymentId(null);
        }}
        deploymentId={selectedDeploymentId}
      />
    </div>
  );
}