import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DetectedStack } from '../common/types';

@Injectable()
export class StackDetectionService {
  private readonly logger = new Logger(StackDetectionService.name);

  async analyzeProject(workspaceDir: string): Promise<DetectedStack> {
    try {
      const files = await this.scanProjectFiles(workspaceDir);
      
      // Check for specific files and patterns
      const hasPackageJson = files.includes('package.json');
      const hasDockerfile = files.includes('Dockerfile') || files.includes('dockerfile');
      const hasRequirementsTxt = files.includes('requirements.txt');
      const hasPomXml = files.includes('pom.xml');
      const hasIndexHtml = files.includes('index.html');
      
      let packageJson: any = null;
      if (hasPackageJson) {
        packageJson = await this.readPackageJson(path.join(workspaceDir, 'package.json'));
      }

      // Detect framework and type
      const detected = await this.detectFrameworkAndType(files, packageJson, workspaceDir);

      return {
        ...detected,
        type: detected.type ?? 'static',
        framework: detected.framework ?? 'unknown',
        hasDockerfile,
        packageManager: await this.detectPackageManager(workspaceDir),
        nodeVersion: packageJson?.engines?.node,
        dependencies: packageJson?.dependencies || {},
      };
    } catch (error) {
      this.logger.error('Failed to analyze project:', error);
      
      // Fallback detection
      return {
        type: 'static',
        framework: 'unknown',
        packageManager: 'npm',
        hasDockerfile: false,
      };
    }
  }

  private async scanProjectFiles(dir: string, maxDepth = 2): Promise<string[]> {
    const files: string[] = [];
    
    const scan = async (currentDir: string, depth: number) => {
      if (depth > maxDepth) return;
      
      try {
        const items = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const item of items) {
          if (item.name.startsWith('.') && !['Dockerfile', '.dockerfile'].includes(item.name)) {
            continue; // Skip hidden files except Dockerfile variants
          }
          
          if (item.isFile()) {
            files.push(item.name);
          } else if (item.isDirectory() && depth < maxDepth) {
            await scan(path.join(currentDir, item.name), depth + 1);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scan(dir, 0);
    return files;
  }

  private async readPackageJson(packageJsonPath: string): Promise<any> {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private async detectFrameworkAndType(
    files: string[],
    packageJson: any,
    workspaceDir: string,
  ): Promise<Partial<DetectedStack>> {
    const dependencies = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    
    // React-based frameworks
    if (dependencies?.['next']) {
      return {
        type: 'ssr',
        framework: 'Next.js',
        buildCmd: 'npm run build',
        distDir: '.next',
        portHint: 3000,
      };
    }
    
    if (dependencies?.['@remix-run/node'] || dependencies?.['@remix-run/dev']) {
      return {
        type: 'ssr',
        framework: 'Remix',
        buildCmd: 'npm run build',
        distDir: 'build',
        portHint: 3000,
      };
    }
    
    if (dependencies?.['gatsby']) {
      return {
        type: 'static',
        framework: 'Gatsby',
        buildCmd: 'npm run build',
        distDir: 'public',
      };
    }
    
    // Vue-based frameworks
    if (dependencies?.['nuxt']) {
      return {
        type: 'ssr',
        framework: 'Nuxt.js',
        buildCmd: 'npm run build',
        distDir: '.nuxt/dist',
        portHint: 3000,
      };
    }
    
    if (dependencies?.['@vue/cli-service'] || files.includes('vue.config.js')) {
      return {
        type: 'spa',
        framework: 'Vue.js',
        buildCmd: 'npm run build',
        distDir: 'dist',
      };
    }
    
    // Angular
    if (dependencies?.['@angular/core'] || files.includes('angular.json')) {
      return {
        type: 'spa',
        framework: 'Angular',
        buildCmd: 'npm run build',
        distDir: 'dist',
      };
    }
    
    // Svelte
    if (dependencies?.['svelte']) {
      return {
        type: 'spa',
        framework: 'Svelte',
        buildCmd: 'npm run build',
        distDir: 'dist',
      };
    }
    
    // Node.js backends
    if (dependencies?.['express']) {
      return {
        type: 'api',
        framework: 'Express.js',
        buildCmd: packageJson?.scripts?.build || 'npm run build',
        portHint: 3000,
      };
    }
    
    if (dependencies?.['@nestjs/core']) {
      return {
        type: 'api',
        framework: 'NestJS',
        buildCmd: 'npm run build',
        distDir: 'dist',
        portHint: 3000,
      };
    }
    
    if (dependencies?.['fastify']) {
      return {
        type: 'api',
        framework: 'Fastify',
        buildCmd: packageJson?.scripts?.build || 'npm start',
        portHint: 3000,
      };
    }
    
    // Static site generators
    if (dependencies?.['vite']) {
      const isReact = dependencies?.['react'];
      const isVue = dependencies?.['vue'];
      
      return {
        type: 'spa',
        framework: isReact ? 'React (Vite)' : isVue ? 'Vue (Vite)' : 'Vite',
        buildCmd: 'npm run build',
        distDir: 'dist',
      };
    }
    
    if (dependencies?.['@11ty/eleventy']) {
      return {
        type: 'static',
        framework: '11ty',
        buildCmd: 'npm run build',
        distDir: '_site',
      };
    }
    
    // React without framework
    if (dependencies?.['react'] && !dependencies?.['next']) {
      return {
        type: 'spa',
        framework: 'React',
        buildCmd: packageJson?.scripts?.build || 'npm run build',
        distDir: 'build',
      };
    }
    
    // Generic Node.js project
    if (packageJson && packageJson.main) {
      return {
        type: 'api',
        framework: 'Node.js',
        buildCmd: packageJson?.scripts?.build || null,
        portHint: 3000,
      };
    }
    
    // Static HTML
    if (files.includes('index.html')) {
      return {
        type: 'static',
        framework: 'Static HTML',
        distDir: '.',
      };
    }
    
    // Python projects
    if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
      const hasDjango = await this.checkForPattern(workspaceDir, 'django');
      const hasFlask = await this.checkForPattern(workspaceDir, 'flask');
      
      if (hasDjango) {
        return {
          type: 'api',
          framework: 'Django',
          buildCmd: 'pip install -r requirements.txt',
          portHint: 8000,
        };
      }
      
      if (hasFlask) {
        return {
          type: 'api',
          framework: 'Flask',
          buildCmd: 'pip install -r requirements.txt',
          portHint: 5000,
        };
      }
      
      return {
        type: 'api',
        framework: 'Python',
        buildCmd: 'pip install -r requirements.txt',
        portHint: 8000,
      };
    }
    
    // Default fallback
    return {
      type: 'static',
      framework: 'Unknown',
    };
  }

  private async checkForPattern(workspaceDir: string, pattern: string): Promise<boolean> {
    try {
      const requirementsPath = path.join(workspaceDir, 'requirements.txt');
      const content = await fs.readFile(requirementsPath, 'utf-8');
      return content.toLowerCase().includes(pattern);
    } catch {
      return false;
    }
  }

  private async detectPackageManager(workspaceDir: string): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
    const files = await fs.readdir(workspaceDir);
    
    if (files.includes('bun.lockb')) return 'bun';
    if (files.includes('pnpm-lock.yaml')) return 'pnpm';
    if (files.includes('yarn.lock')) return 'yarn';
    return 'npm';
  }
}