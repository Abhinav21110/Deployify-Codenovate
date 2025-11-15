import { useState } from 'react';
import { useBlurReveal } from '@/hooks/useBlurReveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Plus } from 'lucide-react';
import { EnhancedDeployModal } from '@/components/EnhancedDeployModal';
import { DeploymentLogs } from '@/components/DeploymentLogs';
import { toast } from 'sonner';

export default function Features() {
  useBlurReveal();
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [logsVisible, setLogsVisible] = useState(false);
  const [deploymentSiteUrl, setDeploymentSiteUrl] = useState<string | null>(null);



  const providers = [
    { id: 'netlify', name: 'Netlify', icon: '🌐', description: 'Static sites and JAMstack' },
    { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Next.js and React apps' },
    { id: 'docker', name: 'Docker', icon: '🐳', description: 'Local full-stack containers' },
  ];

  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="blur-reveal mb-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500/10 backdrop-blur-md border border-indigo-300/30 rounded-full text-sm">
              <span>🚀</span>
              <span className="text-indigo-100">Ready to deploy your projects</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-bold mb-6 blur-reveal blur-reveal-delay-100">
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Deploy Your Project
            </span>
          </h1>

          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 blur-reveal blur-reveal-delay-200" style={{color: '#d8d8e8'}}>
            Automated deployment with intelligent provider selection and real-time monitoring
          </p>



          {/* Deploy Your Own Project Section */}
          <div className="max-w-4xl mx-auto blur-reveal blur-reveal-delay-300">
            <Card className="p-8 rounded-2xl glass-card card-hover text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    Deploy Your Own Project
                  </h2>
                  <p className="text-lg mb-6 text-gray-300 max-w-2xl">
                    Ready to deploy your own repository? Use our enhanced deployment wizard with intelligent provider selection, credential management, and advanced configuration options.
                  </p>
                </div>
                <Button
                  onClick={() => setIsDeployModalOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Deployment
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 blur-reveal">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Deployment Providers
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{color: '#d8d8e8'}}>
              Choose from multiple deployment providers to find the perfect fit for your project
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {providers.map((provider, index) => (
              <div
                key={provider.id}
                className={`blur-reveal blur-reveal-delay-${index * 100} p-8 rounded-2xl glass-card card-hover`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl">{provider.icon}</span>
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 text-white">{provider.name}</h3>
                <p className="text-gray-300">{provider.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Deploy Modal */}
      <EnhancedDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => {
          setIsDeployModalOpen(false);
          setSelectedRepoUrl('');
        }}
        onSuccess={(deploymentData) => {
          setSelectedDeployment(deploymentData.deploymentId);
          setDeploymentSiteUrl(deploymentData.siteUrl);
          setLogsVisible(true);
          setIsDeployModalOpen(false);
          // Show toast notification with deployment info
          toast.success(`🚀 Deployment completed! ID: ${deploymentData.deploymentId.slice(0, 8)}...`, {
            description: "Your project has been successfully deployed!",
            duration: 5000,
            action: deploymentData.siteUrl ? {
              label: 'View Site',
              onClick: () => window.open(deploymentData.siteUrl, '_blank'),
            } : undefined,
          });
        }}
      />

      {/* Deployment Logs */}
      {selectedDeployment && logsVisible && (
        <DeploymentLogs
          deploymentId={selectedDeployment}
          isActive={true}
          isVisible={logsVisible}
          onClose={() => setLogsVisible(false)}
          siteUrl={deploymentSiteUrl || undefined}
        />
      )}
    </div>
  );
}