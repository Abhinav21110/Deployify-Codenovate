import { useState, useEffect } from 'react';
import { useBlurReveal } from '@/hooks/useBlurReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  useBlurReveal();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      navigate('/features');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Welcome back to Deployify!');
      setIsLoading(false);
      navigate('/features');
    }, 1500);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate signup
    setTimeout(() => {
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Account created successfully! Welcome to Deployify!');
      setIsLoading(false);
      navigate('/features');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white px-4 pb-32">
      <div className="max-w-md w-full blur-reveal">
        <div className="text-center mb-8">
          <div className="blur-reveal mb-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500/10 backdrop-blur-md border border-indigo-300/30 rounded-full text-sm">
              <span>🚀</span>
              <span className="text-indigo-100">Join the deployment revolution</span>
            </div>
          </div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 blur-reveal blur-reveal-delay-100">
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Welcome to Deployify
            </span>
          </h1>
          <p className="text-xl blur-reveal blur-reveal-delay-200" style={{color: '#d8d8e8'}}>
            Start your deployment journey today
          </p>
        </div>

        <Card className="p-8 rounded-2xl glass-card card-hover blur-reveal blur-reveal-delay-300">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 backdrop-blur-sm border border-white/10">
              <TabsTrigger 
                value="login" 
                className="text-white data-[state=active]:bg-indigo-500/20 data-[state=active]:text-white data-[state=active]:border-indigo-400/50 data-[state=active]:shadow-lg"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="text-white data-[state=active]:bg-indigo-500/20 data-[state=active]:text-white data-[state=active]:border-indigo-400/50 data-[state=active]:shadow-lg"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="login-email" className="text-white mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="login-password" className="text-white mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <Label htmlFor="signup-name" className="text-white mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email" className="text-white mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="signup-password" className="text-white mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-500"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}