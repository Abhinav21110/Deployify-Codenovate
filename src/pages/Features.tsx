import { useState } from 'react';
import { useBlurReveal } from '@/hooks/useBlurReveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Rocket, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedDeployModal } from '@/components/EnhancedDeployModal';
import { DeploymentLogs } from '@/components/DeploymentLogs';
import { toast } from 'sonner';

export default function Features() {
  useBlurReveal();
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);

  const sampleRepos = [
    {
      name: 'react-portfolio',
      url: 'https://github.com/vercel/portfolio-starter-kit',
      description: 'Modern portfolio built with Next.js and Tailwind CSS',
      stars: '2.3k',
      language: 'TypeScript',
      icon: '🎨',
      framework: 'Next.js',
    },
    {
      name: 'vue-todo-app',
      url: 'https://github.com/vuejs/vue-hackernews-2.0',
      description: 'HackerNews clone built with Vue.js and Server-Side Rendering',
      stars: '1.8k',
      language: 'JavaScript',
      icon: '📰',
      framework: 'Vue.js',
    },
    {
      name: 'static-docs-site',
      url: 'https://github.com/facebook/docusaurus',
      description: 'Documentation site built with Docusaurus',
      stars: '945',
      language: 'React',
      icon: '📚',
      framework: 'Docusaurus',
    },
    {
      name: 'express-api',
      url: 'https://github.com/Microsoft/TypeScript-Node-Starter',
      description: 'Node.js API starter with TypeScript and Express',
      stars: '8.1k',
      language: 'TypeScript',
      icon: '⚡',
      framework: 'Express.js',
    },
  ];

  const providers = [
    { id: 'netlify', name: 'Netlify', icon: '🌐', description: 'Static sites and JAMstack' },
    { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Next.js and React apps' },
  ];

  return (
    <div className="min-h-screen text-white pb-32 px-4">
      <div className="max-w-7xl mx-auto pt-20">
        <div className="text-center mb-16 blur-reveal">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Deploy Your Project
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{color: '#d8d8e8'}}>
            Automated deployment with intelligent provider selection and real-time monitoring
          </p>
        </div>

        {/* Sample Repositories Section */}
        <div className="max-w-6xl mx-auto mb-16 blur-reveal blur-reveal-delay-100">
          <Card className="p-8 glass-card">
            <div className="flex items-center gap-4 mb-6">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-display font-bold" style={{color: '#e8e8f0'}}>Try Sample Repositories</h2>
            </div>
            <p className="mb-6" style={{color: '#d8d8e8'}}>Click on any sample repository to auto-fill and deploy</p>
            <div className="grid md:grid-cols-2 gap-4">
              {sampleRepos.map((repo, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedRepoUrl(repo.url);
                    setIsDeployModalOpen(true);
                  }}
                  className={cn(
                    "p-6 rounded-xl glass-card cursor-pointer card-hover transition-all",
                    selectedRepoUrl === repo.url && "ring-2 ring-purple-400"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{repo.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold" style={{color: '#e8e8f0'}}>{repo.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {repo.framework}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3" style={{color: '#d8d8e8'}}>{repo.description}</p>
                      <div className="flex items-center gap-4 text-sm" style={{color: '#b8b8c8'}}>
                        <span className="flex items-center gap-1">
                          ⭐ {repo.stars}
                        </span>
                        <span className="text-purple-300">{repo.language}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Deploy Your Own Project Section */}
        <div className="max-w-4xl mx-auto blur-reveal blur-reveal-delay-200">
          <Card className="p-8 glass-card text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold mb-4" style={{color: '#e8e8f0'}}>
                  Deploy Your Own Project
                </h2>
                <p className="text-lg mb-6" style={{color: '#d8d8e8'}}>
                  Ready to deploy your own repository? Use our enhanced deployment wizard with intelligent provider selection, credential management, and advanced configuration options.
                </p>
              </div>
              <Button
                onClick={() => setIsDeployModalOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-full"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Deployment
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Enhanced Deploy Modal */}
      <EnhancedDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => {
          setIsDeployModalOpen(false);
          setSelectedRepoUrl('');
        }}
        onSuccess={(deploymentId) => {
          setSelectedDeployment(deploymentId);
          setIsDeployModalOpen(false);
          // Show toast notification with deployment info
          toast.success(`🚀 Deployment started! ID: ${deploymentId.slice(0, 8)}...`, {
            description: "Your project is being built and deployed. Watch the logs below for real-time progress.",
            duration: 5000,
          });
        }}
      />

      {/* Deployment Logs */}
      {selectedDeployment && (
        <DeploymentLogs
          deploymentId={selectedDeployment}
          isActive={!!selectedDeployment}
        />
      )}
    </div>
  );
}