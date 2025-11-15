import { useState } from 'react';
import { useBlurReveal } from '@/hooks/useBlurReveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, Bell, Shield, Zap, Database, Key } from 'lucide-react';
import { toast } from 'sonner';
import { CredentialsManager } from '@/components/CredentialsManager';

export default function Settings() {
  useBlurReveal();
  
  // State for all switches
  const [deploymentSuccess, setDeploymentSuccess] = useState(true);
  const [deploymentFailures, setDeploymentFailures] = useState(true);
  const [costAlerts, setCostAlerts] = useState(false);
  const [autoScaling, setAutoScaling] = useState(true);
  const [cdnOptimization, setCdnOptimization] = useState(true);
  
  // State for inputs
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [apiKey] = useState('dp_key_abc123xyz789');

  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 blur-reveal">
            <div className="blur-reveal mb-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/10 backdrop-blur-md border border-purple-300/30 rounded-full text-sm">
                <span>⚙️</span>
                <span className="text-purple-100">Customize your workspace</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 blur-reveal blur-reveal-delay-100">
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto blur-reveal blur-reveal-delay-200" style={{color: '#d8d8e8'}}>
              Configure your Deployify workspace and deployment preferences
            </p>
          </div>

          <div className="space-y-8">
          {/* Provider Credentials */}
          <div className="blur-reveal">
            <Card className="p-8 rounded-2xl glass-card card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Provider Credentials</h2>
              </div>
              <p className="text-sm mb-6 text-gray-300">
                Add and manage your deployment provider credentials (Netlify, Vercel, etc.)
              </p>
              <CredentialsManager />
            </Card>
          </div>

          {/* Account Settings */}
          <div className="blur-reveal blur-reveal-delay-100">
            <Card className="p-8 rounded-2xl glass-card card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <Settings2 className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Account Settings</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="workspace-name" className="text-white mb-2 block">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="glass-input text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="api-key" className="text-white mb-2 block">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      className="glass-input text-white placeholder:text-gray-400 flex-1"
                      readOnly
                    />
                    <Button 
                      onClick={() => {
                        toast.success('API key regenerated successfully!');
                      }}
                      className="glass-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Notifications */}
          <div className="blur-reveal blur-reveal-delay-200">
            <Card className="p-8 rounded-2xl glass-card card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">Deployment Success</p>
                    <p className="text-sm text-gray-300">Get notified when deployments complete successfully</p>
                  </div>
                  <Switch 
                    checked={deploymentSuccess} 
                    onCheckedChange={(checked) => {
                      setDeploymentSuccess(checked);
                      toast.success(checked ? 'Success notifications enabled' : 'Success notifications disabled');
                    }} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">Deployment Failures</p>
                    <p className="text-sm text-gray-300">Receive alerts for failed deployments</p>
                  </div>
                  <Switch 
                    checked={deploymentFailures} 
                    onCheckedChange={(checked) => {
                      setDeploymentFailures(checked);
                      toast.success(checked ? 'Failure alerts enabled' : 'Failure alerts disabled');
                    }} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">Cost Alerts</p>
                    <p className="text-sm text-gray-300">Alert when spending exceeds threshold</p>
                  </div>
                  <Switch 
                    checked={costAlerts} 
                    onCheckedChange={(checked) => {
                      setCostAlerts(checked);
                      toast.success(checked ? 'Cost alerts enabled' : 'Cost alerts disabled');
                    }} 
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Security */}
          <div className="blur-reveal blur-reveal-delay-300">
            <Card className="p-8 rounded-2xl glass-card card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Security</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-300">Add an extra layer of security</p>
                  </div>
                  <Button 
                    onClick={() => toast.success('Two-factor authentication enabled!')}
                    className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">IP Whitelist</p>
                    <p className="text-sm text-gray-300">Restrict access to specific IP addresses</p>
                  </div>
                  <Button 
                    onClick={() => toast.info('IP whitelist configuration opened')}
                    className="glass-button bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  >
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance */}
          <div className="blur-reveal blur-reveal-delay-400">
            <Card className="p-8 rounded-2xl glass-card card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Performance</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">Auto-scaling</p>
                    <p className="text-sm text-gray-300">Automatically scale based on traffic</p>
                  </div>
                  <Switch 
                    checked={autoScaling} 
                    onCheckedChange={(checked) => {
                      setAutoScaling(checked);
                      toast.success(checked ? 'Auto-scaling enabled' : 'Auto-scaling disabled');
                    }} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card backdrop-blur-md">
                  <div>
                    <p className="font-semibold text-white">CDN Optimization</p>
                    <p className="text-sm text-gray-300">Global content delivery optimization</p>
                  </div>
                  <Switch 
                    checked={cdnOptimization} 
                    onCheckedChange={(checked) => {
                      setCdnOptimization(checked);
                      toast.success(checked ? 'CDN optimization enabled' : 'CDN optimization disabled');
                    }} 
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Database */}
          <div className="blur-reveal blur-reveal-delay-500">
            <Card className="p-8 rounded-2xl glass-card card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Database Connections</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl glass-card backdrop-blur-md border border-green-400/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">PostgreSQL</p>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-400/30">Connected</span>
                  </div>
                  <p className="text-sm text-gray-300">prod-db-01.deployify.io</p>
                </div>
                <Button 
                  onClick={() => toast.success('Opening database connection wizard...')}
                  className="w-full glass-button bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                >
                  Add New Connection
                </Button>
              </div>
            </Card>
          </div>

          {/* Save Button */}
          <div className="blur-reveal blur-reveal-delay-500">
            <Button 
              onClick={() => {
                toast.success('Settings saved successfully!');
                console.log('Settings saved:', {
                  workspaceName,
                  notifications: { deploymentSuccess, deploymentFailures, costAlerts },
                  performance: { autoScaling, cdnOptimization }
                });
              }}
              className="w-full glass-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Save Changes
            </Button>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
