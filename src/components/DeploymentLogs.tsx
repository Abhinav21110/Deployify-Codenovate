import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, ExternalLink, X, RefreshCw } from 'lucide-react';

interface DeploymentLogsProps {
  deploymentId: string;
  isActive: boolean;
  isVisible: boolean;
  onClose: () => void;
  siteUrl?: string;
}

export function DeploymentLogs({ deploymentId, isActive, isVisible, onClose, siteUrl }: DeploymentLogsProps) {
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Deployment ${deploymentId.slice(0, 8)} initiated`,
    `[${new Date().toLocaleTimeString()}] Repository inspection completed`,
    `[${new Date().toLocaleTimeString()}] Creating deployment package...`,
    `[${new Date().toLocaleTimeString()}] Uploading to provider...`,
    `[${new Date().toLocaleTimeString()}] ✅ Deployment completed successfully!`,
  ]);
  const [status, setStatus] = useState<'running' | 'completed'>('running');

  // Simulate real-time log updates only for active deployments
  useEffect(() => {
    if (!isActive) return;

    // Stop simulation after deployment is complete (5 seconds)
    const stopTimer = setTimeout(() => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🎉 Deployment process completed!`]);
      setStatus('completed');
    }, 5000);

    const interval = setInterval(() => {
      // Only add logs for the first 5 seconds
      const now = Date.now();
      const startTime = now - 5000; // 5 seconds ago
      
      if (now - startTime < 5000) {
        const randomLogs = [
          'Processing static assets...',
          'Optimizing images...',
          'Configuring CDN...',
          'Finalizing deployment...',
        ];
        
        if (Math.random() > 0.6) {
          const newLog = `[${new Date().toLocaleTimeString()}] ${randomLogs[Math.floor(Math.random() * randomLogs.length)]}`;
          setLogs(prev => [...prev, newLog]);
        }
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, [isActive]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 z-50">
      <Card className="glass-card border-white/20 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-green-400" />
            <span className="font-medium text-white">Deployment Logs</span>
            <Badge variant="secondary" className="text-xs">
              {deploymentId.slice(0, 8)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // In a real app, this would refresh logs from the backend
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Logs refreshed`]);
              }}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-64">
          <div className="p-4 space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className="text-sm font-mono text-white/80 leading-relaxed"
              >
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">
              Status: {status === 'running' ? 'Processing...' : 'Completed'}
            </span>
            {siteUrl && status === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(siteUrl, '_blank')}
                className="h-7 text-xs border-white/20 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Site
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}