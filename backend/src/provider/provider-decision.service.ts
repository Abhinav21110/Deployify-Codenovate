import { Injectable, Logger } from '@nestjs/common';
import { DetectedStack, ProviderConfig, DeploymentResult } from '../common/types';
import { NetlifyService } from './netlify.service';
import { VercelService } from './vercel.service';
import { DigitalOceanService } from './digitalocean.service';
import { AwsAmplifyService } from './aws-amplify.service';
import { LocalService } from './local.service';

interface ProviderSelectionOptions {
  detected: DetectedStack;
  environment: 'school' | 'staging' | 'prod';
  budget: 'free' | 'low' | 'any';
  preferProviders?: string[];
}

interface DeploymentOptions {
  provider: string;
  artifactPath: string;
  detectedStack: DetectedStack;
  environment: string;
}

@Injectable()
export class ProviderDecisionService {
  private readonly logger = new Logger(ProviderDecisionService.name);

  // Provider configurations
  private readonly providerConfigs: Record<string, ProviderConfig> = {
    local: {
      name: 'Local Static Hosting',
      type: 'static',
      costTier: 'free',
      supportsEnvironments: ['school', 'staging', 'prod'],
      maxBuildTime: 5,
      frameworks: ['static', 'spa', 'gatsby', 'react', 'vue', 'angular', 'svelte', 'html'],
    },
    netlify: {
      name: 'Netlify',
      type: 'static',
      costTier: 'free',
      supportsEnvironments: ['school', 'staging', 'prod'],
      maxBuildTime: 15,
      frameworks: ['static', 'spa', 'gatsby', 'react', 'vue', 'angular', 'svelte'],
    },
    vercel: {
      name: 'Vercel',
      type: 'serverless',
      costTier: 'free',
      supportsEnvironments: ['school', 'staging', 'prod'],
      maxBuildTime: 20,
      frameworks: ['next.js', 'react', 'vue', 'angular', 'static', 'spa'],
    },
    digitalocean: {
      name: 'DigitalOcean App Platform',
      type: 'container',
      costTier: 'low',
      supportsEnvironments: ['staging', 'prod'],
      maxBuildTime: 30,
      frameworks: ['api', 'fullstack', 'container', 'node.js', 'python', 'docker'],
    },
    'aws-amplify': {
      name: 'AWS Amplify',
      type: 'static',
      costTier: 'low',
      supportsEnvironments: ['staging', 'prod'],
      maxBuildTime: 25,
      frameworks: ['react', 'vue', 'angular', 'static', 'spa'],
    },
  };

  constructor(
    private netlifyService: NetlifyService,
    private vercelService: VercelService,
    private digitalOceanService: DigitalOceanService,
    private awsAmplifyService: AwsAmplifyService,
    private localService: LocalService,
  ) {}

  async selectProvider(options: ProviderSelectionOptions): Promise<string> {
    const { detected, environment, budget, preferProviders } = options;

    try {
      // Filter providers based on constraints
      const eligibleProviders = this.filterProviders(detected, environment, budget);

      // Apply user preferences
      let selectedProvider: string;

      if (preferProviders && preferProviders.length > 0) {
        const preferredEligible = eligibleProviders.filter(p => 
          preferProviders.includes(p)
        );
        
        if (preferredEligible.length > 0) {
          selectedProvider = preferredEligible[0];
        } else {
          selectedProvider = eligibleProviders[0];
        }
      } else {
        selectedProvider = this.getBestProvider(eligibleProviders, detected, budget);
      }

      if (!selectedProvider) {
        throw new Error('No suitable deployment provider found');
      }

      this.logger.log(
        `Selected provider: ${selectedProvider} for ${detected.framework} (${detected.type})`,
      );

      return selectedProvider;
    } catch (error) {
      this.logger.error('Provider selection failed:', error);
      throw new Error(`Failed to select provider: ${error.message}`);
    }
  }

  async deployToProvider(options: DeploymentOptions): Promise<DeploymentResult> {
    const { provider, artifactPath, detectedStack, environment } = options;

    try {
      this.logger.log(`Deploying to ${provider}...`);

      let result: DeploymentResult;

      switch (provider) {
        case 'local':
          result = await this.localService.deploy(artifactPath, detectedStack, environment);
          break;
          
        case 'netlify':
          result = await this.netlifyService.deploy(artifactPath, detectedStack, environment);
          break;
          
        case 'vercel':
          result = await this.vercelService.deploy(artifactPath, detectedStack, environment);
          break;
          
        case 'digitalocean':
          result = await this.digitalOceanService.deploy(artifactPath, detectedStack, environment);
          break;
          
        case 'aws-amplify':
          result = await this.awsAmplifyService.deploy(artifactPath, detectedStack, environment);
          break;
          
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // If external provider fails, fallback to local hosting
      if (!result.success && provider !== 'local') {
        this.logger.warn(`${provider} deployment failed, falling back to local hosting`);
        result = await this.localService.deploy(artifactPath, detectedStack, environment);
      }

      return result;
    } catch (error) {
      this.logger.error(`Deployment to ${provider} failed:`, error);
      
      // Try local hosting as fallback
      if (provider !== 'local') {
        this.logger.warn('Attempting local hosting as fallback...');
        try {
          return await this.localService.deploy(artifactPath, detectedStack, environment);
        } catch (fallbackError) {
          this.logger.error('Local hosting fallback also failed:', fallbackError);
        }
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private filterProviders(
    detected: DetectedStack,
    environment: string,
    budget: string,
  ): string[] {
    return Object.entries(this.providerConfigs)
      .filter(([_, config]) => {
        // Check environment support
        if (!config.supportsEnvironments.includes(environment as any)) {
          return false;
        }

        // Check budget constraints
        if (budget === 'free' && config.costTier !== 'free') {
          return false;
        }

        // Check framework compatibility
        const frameworkLower = detected.framework?.toLowerCase() || '';
        const typeLower = detected.type?.toLowerCase() || '';
        
        return config.frameworks.some(fw => 
          frameworkLower.includes(fw) || 
          typeLower.includes(fw) ||
          fw === detected.type
        );
      })
      .map(([name]) => name);
  }

  private getBestProvider(
    eligibleProviders: string[],
    detected: DetectedStack,
    budget: string,
  ): string {
    // Decision matrix based on project type and framework
    const priorities: Record<string, string[]> = {
      // Static sites and SPAs - prioritize local for development/testing
      static: ['local', 'netlify', 'aws-amplify', 'vercel'],
      spa: ['local', 'netlify', 'vercel', 'aws-amplify'],
      
      // Server-side rendering
      ssr: ['vercel', 'digitalocean', 'aws-amplify', 'local'],
      
      // APIs and backends
      api: ['digitalocean', 'vercel', 'local'],
      
      // Full-stack applications
      fullstack: ['digitalocean', 'vercel', 'local'],
      
      // Container-based applications
      container: ['digitalocean', 'local'],
    };

    const typePriorities = priorities[detected.type] || priorities.static;
    
    // Framework-specific overrides
    const frameworkLower = detected.framework?.toLowerCase() || '';
    
    if (frameworkLower.includes('next.js') || frameworkLower.includes('next')) {
      return eligibleProviders.find(p => p === 'vercel') || 
             eligibleProviders.find(p => p === 'local') || 
             eligibleProviders[0];
    }
    
    if (frameworkLower.includes('gatsby')) {
      return eligibleProviders.find(p => p === 'netlify') || 
             eligibleProviders.find(p => p === 'local') || 
             eligibleProviders[0];
    }
    
    if (detected.hasDockerfile) {
      return eligibleProviders.find(p => p === 'digitalocean') || 
             eligibleProviders.find(p => p === 'local') || 
             eligibleProviders[0];
    }

    // Find the highest priority provider that's eligible
    for (const provider of typePriorities) {
      if (eligibleProviders.includes(provider)) {
        return provider;
      }
    }

    // Fallback to local or first eligible provider
    return eligibleProviders.find(p => p === 'local') || eligibleProviders[0] || 'local';
  }

  getProviderInfo(providerName: string): ProviderConfig | undefined {
    return this.providerConfigs[providerName];
  }

  getAllProviders(): Record<string, ProviderConfig> {
    return { ...this.providerConfigs };
  }
}