import { z } from 'zod';

// Tech Stack Detection Interfaces
export interface TechStackDetectionRequest {
  repoUrl: string;
  branch?: string;
  includeDependencies?: boolean;
  includeConfigFiles?: boolean;
}

export interface TechStackItem {
  name: string;
  category: 'framework' | 'language' | 'database' | 'frontend' | 'backend' | 'devops' | 'testing' | 'styling' | 'build-tool' | 'package-manager' | 'other';
  version?: string;
  confidence: number; // 0-1
  files: string[]; // Files that indicate this tech
  description?: string;
}

export interface TechStackAnalysis {
  repoUrl: string;
  branch: string;
  summary: {
    primaryLanguage: string;
    primaryFramework?: string;
    projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'cli' | 'library' | 'unknown';
    complexity: 'simple' | 'moderate' | 'complex';
  };
  technologies: TechStackItem[];
  fileStructure: {
    totalFiles: number;
    directories: string[];
    keyFiles: string[];
    configFiles: string[];
  };
  dependencies?: {
    production: string[];
    development: string[];
    peer?: string[];
  };
  buildInfo: {
    hasBuildScript: boolean;
    buildCommand?: string;
    buildDirectory?: string;
    bundler?: string;
  };
  deploymentHints: {
    suggestedProviders: string[];
    requiredEnvironmentVariables: string[];
    specialConfig: string[];
  };
  confidence: number; // Overall confidence in the analysis
  analyzedAt: string;
}

export interface GeminiConfig {
  apiKey: string;
  model?: string; // Default: gemini-1.5-flash
  temperature?: number; // Default: 0.1
  maxTokens?: number; // Default: 8192
}

// Validation schemas
export const techStackDetectionRequestSchema = z.object({
  repoUrl: z.string().url().refine(
    (url) => url.startsWith('https://github.com/') || url.startsWith('https://gitlab.com/') || url.startsWith('https://bitbucket.org/'),
    { message: 'Repository URL must be a valid Git repository URL' }
  ),
  branch: z.string().optional().default('main'),
  includeDependencies: z.boolean().optional().default(true),
  includeConfigFiles: z.boolean().optional().default(true),
});

// Gemini API Client
export class GeminiTechStackDetector {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-2.5-flash';
    this.temperature = config.temperature || 0.1;
    this.maxTokens = config.maxTokens || 8192;
  }

  private async generateContent(prompt: string): Promise<string> {
    const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  private createAnalysisPrompt(repoContent: any, request: TechStackDetectionRequest): string {
    return `
You are an expert software engineer specializing in technology stack detection. Analyze the following repository structure and content to identify the technology stack.

Repository: ${request.repoUrl}
Branch: ${request.branch}

Repository Content:
${JSON.stringify(repoContent, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": {
    "primaryLanguage": "main programming language",
    "primaryFramework": "main framework if any",
    "projectType": "frontend|backend|fullstack|mobile|desktop|cli|library|unknown",
    "complexity": "simple|moderate|complex"
  },
  "technologies": [
    {
      "name": "technology name",
      "category": "framework|language|database|frontend|backend|devops|testing|styling|build-tool|package-manager|other",
      "version": "version if detectable",
      "confidence": 0.0-1.0,
      "files": ["file paths that indicate this technology"],
      "description": "brief description of what this technology does"
    }
  ],
  "fileStructure": {
    "totalFiles": number,
    "directories": ["important directories"],
    "keyFiles": ["important source files"],
    "configFiles": ["configuration files"]
  },
  "dependencies": {
    "production": ["production dependencies"],
    "development": ["development dependencies"],
    "peer": ["peer dependencies if any"]
  },
  "buildInfo": {
    "hasBuildScript": boolean,
    "buildCommand": "detected build command",
    "buildDirectory": "output directory",
    "bundler": "detected bundler"
  },
  "deploymentHints": {
    "suggestedProviders": ["vercel", "netlify", "heroku", etc],
    "requiredEnvironmentVariables": ["env vars that might be needed"],
    "specialConfig": ["any special deployment configs"]
  },
  "confidence": 0.0-1.0
}

Focus on:
1. Identifying the main programming language(s) and frameworks
2. Detecting frontend vs backend vs fullstack nature
3. Build tools and bundlers
4. Package managers and dependency files
5. Deployment configuration
6. Testing frameworks
7. Database technologies
8. Any special configurations or requirements

Be thorough but only include technologies you're confident about (confidence > 0.5). Return only valid JSON.
`;
  }

  async detectTechStack(request: TechStackDetectionRequest): Promise<TechStackAnalysis> {
    try {
      // First, we need to fetch the repository content
      const repoContent = await this.fetchRepositoryContent(request);
      
      // Generate analysis using Gemini
      const prompt = this.createAnalysisPrompt(repoContent, request);
      const response = await this.generateContent(prompt);
      
      // Parse the JSON response
      const analysisData = JSON.parse(response);
      
      // Validate and format the response
      return {
        repoUrl: request.repoUrl,
        branch: request.branch,
        ...analysisData,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Tech stack detection failed:', error);
      throw new Error(`Failed to detect tech stack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchRepositoryContent(request: TechStackDetectionRequest): Promise<any> {
    // This would need to be implemented based on how you want to fetch repo content
    // Options:
    // 1. Use GitHub/GitLab API
    // 2. Use a backend service that clones and analyzes repos
    // 3. Use a file system approach for local repos
    
    // For now, return a basic structure that would be populated by your backend
    return {
      message: "Repository content fetching needs to be implemented",
      repoUrl: request.repoUrl,
      branch: request.branch
    };
  }

  // Helper method to analyze a local repository
  async analyzeLocalRepo(repoPath: string): Promise<TechStackAnalysis> {
    try {
      // This would read the local file system and analyze the repo
      // Implementation would depend on whether this runs in browser or Node.js
      throw new Error("Local repo analysis not yet implemented");
    } catch (error) {
      console.error('Local repo analysis failed:', error);
      throw error;
    }
  }
}

// Factory function to create detector with environment config
export function createGeminiDetector(): GeminiTechStackDetector {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY environment variable is required');
  }

  return new GeminiTechStackDetector({
    apiKey,
    model: 'gemini-2.5-flash',
    temperature: 0.1,
    maxTokens: 8192,
  });
}

// React Query integration
export const useTechStackDetection = () => {
  const detector = createGeminiDetector();
  
  return {
    detectTechStack: (request: TechStackDetectionRequest) => detector.detectTechStack(request),
    analyzeLocalRepo: (repoPath: string) => detector.analyzeLocalRepo(repoPath),
  };
};

// The types are already exported above, no need to re-export them
