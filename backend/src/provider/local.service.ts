import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DetectedStack, DeploymentResult } from '../common/types';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalService {
  private readonly logger = new Logger(LocalService.name);
  private readonly staticDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Create a local static hosting directory
    this.staticDir = path.join(process.cwd(), 'static-hosting');
    this.baseUrl = 'http://localhost:3000/static';
  }

  async deploy(
    artifactPath: string,
    detectedStack: DetectedStack,
    environment: string,
  ): Promise<DeploymentResult> {
    try {
      this.logger.log(`Deploying ${detectedStack.framework} to local static hosting...`);

      // Generate a unique deployment ID
      const deploymentId = `deploy-${Date.now()}`;
      const deploymentDir = path.join(this.staticDir, deploymentId);

      // Ensure static hosting directory exists
      await fs.mkdir(this.staticDir, { recursive: true });
      await fs.mkdir(deploymentDir, { recursive: true });

      // Copy artifact to deployment directory
      await this.copyDirectory(artifactPath, deploymentDir);

      // Generate deployment URL
      const deploymentUrl = `${this.baseUrl}/${deploymentId}`;

      this.logger.log(`Local deployment successful: ${deploymentUrl}`);

      return {
        success: true,
        url: deploymentUrl,
        metadata: {
          provider: 'local',
          environment,
          deployedAt: new Date().toISOString(),
          artifactPath,
          deploymentDir,
        },
      };
    } catch (error) {
      this.logger.error('Local deployment failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    try {
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      await fs.mkdir(dest, { recursive: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to copy directory from ${src} to ${dest}:`, error);
      throw error;
    }
  }

  async listDeployments(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.staticDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      this.logger.warn('Failed to list deployments:', error);
      return [];
    }
  }

  async deleteDeployment(deploymentId: string): Promise<boolean> {
    try {
      const deploymentDir = path.join(this.staticDir, deploymentId);
      await fs.rm(deploymentDir, { recursive: true, force: true });
      this.logger.log(`Deleted local deployment: ${deploymentId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete deployment ${deploymentId}:`, error);
      return false;
    }
  }
}