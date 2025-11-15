import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Github, Globe, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deploymentData: any) => void;
}

export function EnhancedDeployModal({ isOpen, onClose, onSuccess }: EnhancedDeployModalProps) {
  const [gitUrl, setGitUrl] = useState('');
  const [provider, setProvider] = useState('netlify');
  const [deployMode, setDeployMode] = useState('drag-drop');

  // Auto-update deploy mode when provider changes
  useEffect(() => {
    if (provider === 'docker') {
      setDeployMode('docker-local');
    } else if (deployMode === 'docker-local') {
      setDeployMode('drag-drop');
    }
  }, [provider]);
  const [buildDir, setBuildDir] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState('');
  const [inspectionResult, setInspectionResult] = useState<any>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const handleInspect = async () => {
    if (!gitUrl.trim()) {
      toast.error('Please enter a Git repository URL');
      return;
    }

    if (!gitUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }

    setIsInspecting(true);
    setInspectionResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/repo/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: gitUrl.trim(),
          branch: 'main'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Inspection failed');
      }

      setInspectionResult(data);
      
      if (data.hasPrebuilt) {
        toast.success(`Found prebuilt folders: ${data.candidates.join(', ')}`);
        if (data.candidates.length > 0) {
          setBuildDir(data.candidates[0]); // Set first candidate as default
        }
      } else {
        toast.warning('No prebuilt folders found. Consider using git-import mode.');
        setDeployMode('git-import');
      }

    } catch (error) {
      console.error('Inspection error:', error);
      toast.error('Repository inspection failed', {
        description: error instanceof Error ? error.message : 'Failed to inspect repository',
      });
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDeploy = async () => {
    if (!gitUrl.trim()) {
      toast.error('Please enter a Git repository URL');
      return;
    }

    if (deployMode === 'drag-drop' && !inspectionResult?.hasPrebuilt && !buildDir) {
      toast.error('Please inspect the repository first or specify a build directory');
      return;
    }

    if (provider === 'docker') {
      // Check if Docker is available (basic check)
      toast.info('Starting Docker deployment - this may take a few minutes to build the image...');
    }

    setIsDeploying(true);
    setDeploymentStep('Initializing deployment...');

    try {
      setDeploymentStep('Starting deployment...');
      
      const requestBody: any = {
        repoUrl: gitUrl.trim(),
        provider,
        deployMode,
        branch: 'main'
      };

      if (buildDir && deployMode === 'drag-drop') {
        requestBody.buildDir = buildDir;
      }
      
      console.log('Making request to:', `${backendUrl}/api/deploy`);
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${backendUrl}/api/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setDeploymentStep('Deployment successful!');
      
      const siteUrl = data.site_url || data.siteUrl || data.deployment_url;
      
      if (data.provider === 'vercel') {
        toast.success('🎉 Vercel project created!', {
          description: 'Your project is connected to GitHub and will auto-deploy. Check back in 2-3 minutes.',
          duration: 15000,
          action: siteUrl ? {
            label: 'View Project URL',
            onClick: () => window.open(siteUrl, '_blank'),
          } : undefined,
        });
      } else if (data.provider === 'docker') {
        toast.success('🐳 Docker deployment successful!', {
          description: `Your full-stack app is running locally at: ${siteUrl}`,
          duration: 15000,
          action: siteUrl ? {
            label: 'Open App',
            onClick: () => window.open(siteUrl, '_blank'),
          } : undefined,
        });
      } else {
        toast.success('🎉 Deployment completed!', {
          description: siteUrl ? `Your site is live at: ${siteUrl}` : 'Deployment created successfully',
          duration: 10000,
          action: siteUrl ? {
            label: 'Open Site',
            onClick: () => window.open(siteUrl, '_blank'),
          } : undefined,
        });
      }

      onSuccess({
        deploymentId: data.deploymentId || data.deploy_id || data.project_id,
        gitUrl: gitUrl.trim(),
        provider: data.provider,
        siteUrl: siteUrl,
        siteName: data.siteName || `${provider} deployment`,
        status: data.status
      });
      
      // Reset form
      setGitUrl('');
      setBuildDir('');
      setInspectionResult(null);
      
    } catch (error) {
      console.error('Deployment error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to backend server. Make sure the backend is running on port 4000.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Deployment failed', {
        description: errorMessage,
      });
      setDeploymentStep('');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    if (!isDeploying && !isInspecting) {
      onClose();
      setGitUrl('');
      setBuildDir('');
      setInspectionResult(null);
      setDeploymentStep('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] glass-card border-white/20 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-white/10">
          <DialogTitle className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Github className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
            Deploy from Git Repository
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-4 md:space-y-6 py-4">
            {/* Git Repository URL */}
            <div className="space-y-2">
              <Label htmlFor="gitUrl" className="text-white font-medium text-sm md:text-base">
                GitHub Repository URL
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="gitUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  disabled={isDeploying || isInspecting}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm"
                />
                <Button
                  onClick={handleInspect}
                  disabled={isInspecting || isDeploying || !gitUrl.trim()}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  {isInspecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isInspecting ? 'Inspecting...' : 'Inspect'}
                </Button>
              </div>
              <p className="text-xs md:text-sm text-white/70">
                Only public GitHub repositories are supported
              </p>
            </div>

          {/* Inspection Results */}
          {inspectionResult && (
            <Card className="p-4 bg-white/5 border-white/20">
              <div className="flex items-start gap-3">
                {inspectionResult.hasPrebuilt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-white mb-2">
                    {inspectionResult.hasPrebuilt ? 'Prebuilt folders found' : 'No prebuilt folders found'}
                  </p>
                  {inspectionResult.hasPrebuilt ? (
                    <div className="flex gap-2 flex-wrap">
                      {inspectionResult.candidates.map((folder: string) => (
                        <Badge key={folder} variant="secondary" className="text-xs">
                          {folder}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/70">
                      Consider using git-import mode to let the provider build your project
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

            {/* Provider Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm md:text-base">Provider</Label>
                <Select value={provider} onValueChange={setProvider} disabled={isDeploying}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="netlify">Netlify</SelectItem>
                    <SelectItem value="vercel">Vercel</SelectItem>
                    <SelectItem value="docker">Docker (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium text-sm md:text-base">Deploy Mode</Label>
                <Select 
                  value={deployMode} 
                  onValueChange={setDeployMode} 
                  disabled={isDeploying}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {provider === 'docker' ? (
                      <SelectItem value="docker-local">Docker Container (Full-Stack)</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="drag-drop">Drag & Drop (prebuilt)</SelectItem>
                        <SelectItem value="git-import">Git Import (provider builds)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Build Directory (for drag-drop mode) */}
            {deployMode === 'drag-drop' && (
              <div className="space-y-2">
                <Label htmlFor="buildDir" className="text-white font-medium text-sm md:text-base">
                  Build Directory (Optional)
                </Label>
                <Input
                  id="buildDir"
                  type="text"
                  placeholder="build, dist, or public"
                  value={buildDir}
                  onChange={(e) => setBuildDir(e.target.value)}
                  disabled={isDeploying}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm h-9 md:h-10"
                />
                <p className="text-xs md:text-sm text-white/70">
                  Leave empty to auto-detect from inspection results
                </p>
              </div>
            )}

          {/* Docker Info */}
          {provider === 'docker' && (
            <Card className="p-4 bg-blue-500/10 border-blue-400/30">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🐳</div>
                <div>
                  <p className="font-medium text-blue-100 mb-1">Docker Local Deployment</p>
                  <ul className="text-sm text-blue-200/70 space-y-1">
                    <li>• Creates a single Docker image with frontend + backend</li>
                    <li>• Runs locally on your machine (requires Docker installed)</li>
                    <li>• Full-stack application in one container</li>
                    <li>• Accessible at http://localhost:PORT</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

            {/* Deployment Status */}
            {isDeploying && (
              <Card className="p-3 md:p-4 bg-blue-500/10 border-blue-400/30">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-blue-100 text-sm md:text-base truncate">{deploymentStep}</p>
                    <p className="text-xs md:text-sm text-blue-200/70">
                      This may take a few minutes...
                    </p>
                  </div>
                </div>
              </Card>
            )}

          {/* Info Card */}
          <Card className="p-4 bg-orange-500/10 border-orange-400/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <p className="font-medium text-orange-100 mb-1">
                  {deployMode === 'drag-drop' ? 'Drag & Drop Mode' : 
                   deployMode === 'docker-local' ? 'Docker Local Mode' : 'Git Import Mode'}
                </p>
                <ul className="text-sm text-orange-200/70 space-y-1">
                  {deployMode === 'drag-drop' ? (
                    <>
                      <li>• Uploads prebuilt static files from your repository</li>
                      <li>• Requires build, dist, or public folder in your repo</li>
                      <li>• No server-side building - instant deployment</li>
                    </>
                  ) : deployMode === 'docker-local' ? (
                    <>
                      <li>• Creates a Docker image with your full application</li>
                      <li>• Includes both frontend and backend in one container</li>
                      <li>• Runs locally on your machine (requires Docker)</li>
                      <li>• Perfect for full-stack applications</li>
                    </>
                  ) : (
                    <>
                      <li>• Links your repository to the provider</li>
                      <li>• Provider builds your project automatically</li>
                      <li>• Supports any framework with build scripts</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </Card>

          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 pt-4 border-t border-white/10 mt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isDeploying || isInspecting}
              className="flex-1 border-white/20 text-white hover:bg-white/10 h-9 md:h-10 text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || isInspecting || !gitUrl.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white h-9 md:h-10 text-sm md:text-base"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="hidden sm:inline">Deploying...</span>
                  <span className="sm:hidden">Deploy...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {`Deploy ${provider === 'docker' ? 'with Docker' : `to ${provider === 'netlify' ? 'Netlify' : 'Vercel'}`}`}
                  </span>
                  <span className="sm:hidden">
                    {provider === 'docker' ? 'Docker' : provider === 'netlify' ? 'Netlify' : 'Vercel'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}