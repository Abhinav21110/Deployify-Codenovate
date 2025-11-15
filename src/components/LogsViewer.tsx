import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Terminal, AlertCircle, Info } from 'lucide-react';

interface LogEntry {
  level: 'info' | 'error';
  timestamp: string;
  message: string;
}

interface LogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentId?: string | null;
}

export function LogsViewer({ isOpen, onClose, deploymentId }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = deploymentId 
        ? `${backendUrl}/api/deploy/logs/${deploymentId}`
        : `${backendUrl}/api/logs`;
        
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      // Auto-refresh logs every 5 seconds when modal is open
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogIcon = (level: string) => {
    return level === 'error' ? (
      <AlertCircle className="h-4 w-4 text-red-400" />
    ) : (
      <Info className="h-4 w-4 text-blue-400" />
    );
  };

  const getLogColor = (level: string) => {
    return level === 'error' ? 'text-red-300' : 'text-gray-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Terminal className="h-6 w-6 text-green-400" />
            {deploymentId ? `Deployment Logs - ${deploymentId.slice(0, 8)}` : 'Backend Logs'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {logs.length > 0 ? `Showing last ${logs.length} log entries` : 'No logs available'}
            </div>
            <Button
              onClick={fetchLogs}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Card className="p-4 bg-red-500/10 border-red-400/30">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Logs Display */}
          <Card className="bg-black/40 border-white/20">
            <ScrollArea className="h-96 p-4">
              {logs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {isLoading ? 'Loading logs...' : 'No logs available'}
                </div>
              ) : (
                <div className="space-y-2 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {getLogIcon(log.level)}
                        <span className="text-gray-500 text-xs">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <div className={`flex-1 ${getLogColor(log.level)} break-all`}>
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Info */}
          <div className="text-xs text-gray-500">
            Logs auto-refresh every 5 seconds. Only the last 50 entries are shown.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}