import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Clock, GitBranch, Globe, AlertCircle, ExternalLink, Eye, Search, RefreshCw, X, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { DeploymentStatus, DeploymentRequest } from '@/lib/api';
import { useBlurReveal } from '@/hooks/useBlurReveal';
import { toast } from 'sonner';

const statusConfig = {
  queued: { icon: Clock, color: 'text-yellow-500 bg-yellow-100', label: 'Queued' },
  cloning: { icon: GitBranch, color: 'text-blue-500 bg-blue-100', label: 'Cloning' },
  detecting: { icon: Clock, color: 'text-blue-500 bg-blue-100', label: 'Analyzing' },
  building: { icon: Clock, color: 'text-blue-500 bg-blue-100', label: 'Building' },
  deploying: { icon: Globe, color: 'text-blue-500 bg-blue-100', label: 'Deploying' },
  success: { icon: CheckCircle, color: 'text-green-500 bg-green-100', label: 'Success' },
  failed: { icon: AlertCircle, color: 'text-red-500 bg-red-100', label: 'Failed' },
  cancelled: { icon: X, color: 'text-gray-500 bg-gray-100', label: 'Cancelled' },
};

function DeploymentsPage() {
  useBlurReveal();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeployment, setNewDeployment] = useState({
    repoUrl: '',
    branch: 'main',
    environment: 'school' as 'school' | 'staging' | 'prod',
    budget: 'free' as 'free' | 'low' | 'any',
  });

  const queryClient = useQueryClient();

  // Fetch deployments from API
  const { data: deploymentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => apiClient.getDeployments(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create deployment mutation
  const createDeploymentMutation = useMutation({
    mutationFn: (data: DeploymentRequest) => apiClient.createDeployment(data),
    onSuccess: (response) => {
      toast.success(`Deployment ${response.deploymentId} started!`);
      setIsCreateModalOpen(false);
      setNewDeployment({
        repoUrl: '',
        branch: 'main',
        environment: 'school',
        budget: 'free',
      });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to start deployment: ${error.message}`);
    },
  });

  const deployments = deploymentsData?.deployments || [];

  const filteredDeployments = deployments.filter((deployment: DeploymentStatus) =>
    searchTerm === '' ||
    deployment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deployment.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deployment.detected?.framework?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewDeployment = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateDeployment = () => {
    createDeploymentMutation.mutate(newDeployment);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white pb-32 px-4">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
            <span className="ml-2 text-xl">Loading deployments...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white pb-32 px-4">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error loading deployments</h1>
            <p className="text-gray-400 mb-4">Please make sure the backend is running.</p>
            <Button onClick={() => refetch()} className="bg-indigo-600 hover:bg-indigo-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto py-8 px-4">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Deployments
              </h1>
              <p className="text-gray-300">
                Manage and monitor your deployment history
              </p>
            </div>
            <Button 
              onClick={handleNewDeployment}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Deployment
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deployments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-card border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Deployments Grid */}
          <div className="grid gap-6">
            {filteredDeployments.length === 0 ? (
              <div className="text-center py-12">
                <div className="glass-card rounded-xl p-8 max-w-md mx-auto">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-300">No deployments found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first deployment.'}
                  </p>
                  <Button 
                    onClick={handleNewDeployment}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full"
                  >
                    Create Deployment
                  </Button>
                </div>
              </div>
            ) : (
              filteredDeployments.map((deployment) => {
                const StatusIcon = statusConfig[deployment.status]?.icon || Clock;
                const statusLabel = statusConfig[deployment.status]?.label || deployment.status;

                return (
                  <div key={deployment.id} className="glass-card card-hover rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="font-mono text-sm text-gray-300 bg-black/20 px-3 py-1 rounded-full">
                            {deployment.id}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`gap-1 ${statusConfig[deployment.status]?.color || 'text-gray-500'} border-current/30`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusLabel}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Framework</div>
                            <div className="font-medium text-white">{deployment.detected?.framework || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{deployment.detected?.type || 'Unknown'}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Provider</div>
                            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                              {deployment.provider}
                            </Badge>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Created</div>
                            <div className="text-sm text-white">
                              {new Date(deployment.createdAt).toLocaleDateString()} at{' '}
                              {new Date(deployment.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-card border-white/20 text-white hover:bg-white/10"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        {deployment.url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass-card border-white/20 text-white hover:bg-white/10"
                            onClick={() => window.open(deployment.url!, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Stats */}
          {filteredDeployments.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-400">
              Showing {filteredDeployments.length} of {deployments.length} deployments
            </div>
          )}
        </div>

        {/* Deploy Modal Placeholder */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-white">New Deployment</h2>
              <p className="text-gray-300 mb-6">Deploy modal functionality coming soon!</p>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="glass-card border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  Deploy
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeploymentsPage;