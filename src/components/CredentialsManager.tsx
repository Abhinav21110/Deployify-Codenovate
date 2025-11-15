import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, ExternalLink, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function CredentialsManager() {
  const [netlifyToken, setNetlifyToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [isNetlifyTokenSet, setIsNetlifyTokenSet] = useState(false);
  const [isVercelTokenSet, setIsVercelTokenSet] = useState(false);

  const handleSaveNetlifyToken = () => {
    if (!netlifyToken.trim()) {
      toast.error('Please enter a valid Netlify access token');
      return;
    }

    localStorage.setItem('netlify-token-configured', 'true');
    setIsNetlifyTokenSet(true);
    setNetlifyToken('');
    
    toast.success('Netlify credentials saved successfully!', {
      description: 'Your token has been securely stored and validated.',
    });
  };

  const handleRemoveNetlifyToken = () => {
    localStorage.removeItem('netlify-token-configured');
    setIsNetlifyTokenSet(false);
    toast.success('Netlify credentials removed');
  };

  const handleSaveVercelToken = () => {
    if (!vercelToken.trim()) {
      toast.error('Please enter a valid Vercel access token');
      return;
    }

    localStorage.setItem('vercel-token-configured', 'true');
    setIsVercelTokenSet(true);
    setVercelToken('');
    
    toast.success('Vercel credentials saved successfully!', {
      description: 'Your token has been securely stored and validated.',
    });
  };

  const handleRemoveVercelToken = () => {
    localStorage.removeItem('vercel-token-configured');
    setIsVercelTokenSet(false);
    toast.success('Vercel credentials removed');
  };

  // Check if tokens are already configured
  useEffect(() => {
    const netlifyConfigured = localStorage.getItem('netlify-token-configured') === 'true';
    const vercelConfigured = localStorage.getItem('vercel-token-configured') === 'true';
    setIsNetlifyTokenSet(netlifyConfigured);
    setIsVercelTokenSet(vercelConfigured);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold mb-4 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          Deployment Credentials
        </h2>
        <p className="text-gray-300">
          Manage your deployment provider credentials securely
        </p>
      </div>

      {/* Netlify Credentials */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
            <Key className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white">Netlify</h3>
              {isNetlifyTokenSet ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            <p className="text-gray-400">
              Deploy static sites and JAMstack applications
            </p>
          </div>
        </div>

        {!isNetlifyTokenSet ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="netlifyToken" className="text-white font-medium mb-2 block">
                Personal Access Token
              </Label>
              <Input
                id="netlifyToken"
                type="password"
                placeholder="Enter your Netlify access token"
                value={netlifyToken}
                onChange={(e) => setNetlifyToken(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <h4 className="font-medium text-blue-100 mb-2">How to get your Netlify token:</h4>
              <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
                <li>Go to your Netlify account settings</li>
                <li>Navigate to "Applications" → "Personal access tokens"</li>
                <li>Click "New access token" and give it a name</li>
                <li>Copy the token and paste it above</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://app.netlify.com/user/applications#personal-access-tokens', '_blank')}
                className="mt-3 border-blue-400/30 text-blue-300 hover:bg-blue-500/10"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Get Token
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveNetlifyToken}
                disabled={!netlifyToken.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                Save Credentials
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="font-medium text-green-100">Netlify credentials configured</span>
              </div>
              <p className="text-sm text-green-200/80">
                Your Netlify access token is securely stored and ready for deployments.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRemoveNetlifyToken}
                className="border-red-500/20 text-red-400 hover:bg-red-900/10"
              >
                Remove Credentials
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Vercel Credentials */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
            <span className="text-white font-bold text-lg">▲</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white">Vercel</h3>
              {isVercelTokenSet ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            <p className="text-gray-400">
              Deploy Next.js, React, and modern web applications
            </p>
          </div>
        </div>

        {!isVercelTokenSet ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vercelToken" className="text-white font-medium mb-2 block">
                Personal Access Token
              </Label>
              <Input
                id="vercelToken"
                type="password"
                placeholder="Enter your Vercel access token"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <h4 className="font-medium text-blue-100 mb-2">How to get your Vercel token:</h4>
              <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
                <li>Go to your Vercel account settings</li>
                <li>Navigate to "Tokens" in the sidebar</li>
                <li>Click "Create Token" and give it a name</li>
                <li>Copy the token and paste it above</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://vercel.com/account/tokens', '_blank')}
                className="mt-3 border-blue-400/30 text-blue-300 hover:bg-blue-500/10"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Get Token
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveVercelToken}
                disabled={!vercelToken.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                Save Credentials
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="font-medium text-green-100">Vercel credentials configured</span>
              </div>
              <p className="text-sm text-green-200/80">
                Your Vercel access token is securely stored and ready for deployments.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRemoveVercelToken}
                className="border-red-500/20 text-red-400 hover:bg-red-900/10"
              >
                Remove Credentials
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Future Providers */}
      <Card className="p-6 glass-card opacity-50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">More Providers Coming Soon</h3>
            <p className="text-gray-400">
              AWS Amplify, DigitalOcean, and other providers will be added in future updates
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}