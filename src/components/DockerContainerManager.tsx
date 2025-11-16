import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RotateCcw, ExternalLink, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface DockerContainerManagerProps {
  deploymentId: string;
  containerName: string;
  siteUrl: string;
  initialStatus?: string;
}

export function DockerContainerManager({ 
  deploymentId, 
  containerName, 
  siteUrl, 
  initialStatus = 'running' 
}: DockerContainerManagerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const handleContainerAction = async (action: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/deploy/container/${deploymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Container action failed');
      }

      if (action === 'status') {
        setStatus(data.containerStatus);
        toast.info(`Container status: ${data.containerStatus}`);
      } else if (action === 'restart') {
        setStatus('running');
        toast.success('Container restarted successfully', {
          description: 'Your application is now running again',
          action: data.url ? {
            label: 'Open App',
            onClick: () => window.open(data.url, '_blank'),
          } : undefined,
        });
      } else {
        setStatus(action === 'stop' ? 'stopped' : 'running');
        toast.success(`Container ${action} successful`);
      }

    } catch (error) {
      console.error('Container action error:', error);
      toast.error(`Failed to ${action} container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (containerStatus: string) => {
    switch (containerStatus) {
      case 'running':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'stopped':
      case 'exited':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'paused':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (containerStatus: string) => {
    switch (containerStatus) {
      case 'running':
        return <Activity className="h-3 w-3" />;
      case 'stopped':
      case 'exited':
        return <Square className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card className="p-4 glass-card-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🐳</div>
          <div>
            <h3 className="font-semibold text-white">Docker Container</h3>
            <p className="text-sm text-gray-300">{containerName}</p>
          </div>
        </div>
        <Badge className={`gap-1 ${getStatusColor(status)} border-current/30`}>
          {getStatusIcon(status)}
          {status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={() => handleContainerAction('status')}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="glass-card border-blue-500/20 text-blue-400 hover:bg-blue-900/10"
        >
          <Activity className="h-3 w-3 mr-1" />
          Check Status
        </Button>

        {status === 'running' && (
          <>
            <Button
              onClick={() => window.open(siteUrl, '_blank')}
              variant="outline"
              size="sm"
              className="glass-card border-green-500/20 text-green-400 hover:bg-green-900/10"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open App
            </Button>

            <Button
              onClick={() => handleContainerAction('stop')}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="glass-card border-red-500/20 text-red-400 hover:bg-red-900/10"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </>
        )}

        {status !== 'running' && (
          <Button
            onClick={() => handleContainerAction('restart')}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="glass-card border-green-500/20 text-green-400 hover:bg-green-900/10"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restart
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-400">
        <p>Local URL: <span className="text-blue-400">{siteUrl}</span></p>
        <p>Container: <span className="text-purple-400">{containerName}</span></p>
      </div>
    </Card>
  );
}