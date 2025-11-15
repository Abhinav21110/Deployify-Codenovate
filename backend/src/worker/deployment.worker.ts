import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';

import { DeploymentService } from '../deployment/deployment.service';
import { StackDetectionService } from './stack-detection.service';
import { ContainerService } from './container.service';
import { ProviderDecisionService } from '../provider/provider-decision.service';

interface DeploymentJobData {
  deploymentId: string;
  repoUrl: string;
  branch: string;
  environment: 'school' | 'staging' | 'prod';
  budget: 'free' | 'low' | 'any';
  preferProviders?: string[];
}

@Processor('deployment')
@Injectable()
export class DeploymentWorker {
  private readonly logger = new Logger(DeploymentWorker.name);

  constructor(
    private deploymentService: DeploymentService,
    private stackDetectionService: StackDetectionService,
    private containerService: ContainerService,
    private providerDecisionService: ProviderDecisionService,
  ) {}

  @Process('process-deployment')
  async processDeployment(job: Job<DeploymentJobData>) {
    const { deploymentId, repoUrl, branch, environment, budget, preferProviders } = job.data;
    let workspaceDir: string | null = null;

    try {
      await this.logProgress(deploymentId, 'info', 'Starting deployment process...');

      // Step 1: Clone repository
      await this.deploymentService.updateDeploymentStatus(deploymentId, 'cloning');
      await this.logProgress(deploymentId, 'info', `Cloning repository ${repoUrl}...`);

      workspaceDir = await this.containerService.cloneRepository(repoUrl, branch);

      // Step 2: Detect tech stack
      await this.deploymentService.updateDeploymentStatus(deploymentId, 'detecting');
      await this.logProgress(deploymentId, 'info', 'Analyzing project structure...');

      const detectedStack = await this.stackDetectionService.analyzeProject(workspaceDir);
      await this.deploymentService.updateDeploymentStatus(deploymentId, 'detecting', {
        detectedStack,
      });

      await this.logProgress(
        deploymentId,
        'info',
        `Detected ${detectedStack.framework} (${detectedStack.type}) project`,
      );

      // Step 3: Select provider
      const provider = await this.providerDecisionService.selectProvider({
        detected: detectedStack,
        environment,
        budget,
        preferProviders,
      });

      await this.logProgress(deploymentId, 'info', `Selected provider: ${provider}`);

      // Step 4: Build project
      await this.deploymentService.updateDeploymentStatus(deploymentId, 'building', {
        provider,
      });

      const buildResult = await this.containerService.buildProject({
        workspaceDir,
        detectedStack,
        deploymentId,
        onLog: (level, message) => this.logProgress(deploymentId, level, message),
      });

      if (!buildResult.success) {
        throw new Error(buildResult.error || 'Build failed');
      }

      // Step 5: Deploy to provider
      await this.deploymentService.updateDeploymentStatus(deploymentId, 'deploying');
      await this.logProgress(deploymentId, 'info', `Deploying to ${provider}...`);

      const deployResult = await this.providerDecisionService.deployToProvider({
        provider,
        artifactPath: buildResult.artifactPath,
        detectedStack,
        environment,
      });

      if (!deployResult.success) {
        throw new Error(deployResult.error || 'Deployment failed');
      }

      // Step 6: Success
      await this.deploymentService.updateDeploymentStatus(deploymentId, 'success', {
        deploymentUrl: deployResult.url,
      });

      await this.logProgress(
        deploymentId,
        'info',
        `Deployment successful! Available at: ${deployResult.url}`,
      );

    } catch (error: any) {
      this.logger.error(`Deployment ${deploymentId} failed:`, error);

      await this.deploymentService.updateDeploymentStatus(deploymentId, 'failed', {
        errorMessage: error?.message || String(error),
      });

      await this.logProgress(deploymentId, 'error', `Deployment failed: ${error?.message || String(error)}`);

      throw error;
    } finally {
      // Always cleanup workspace
      if (workspaceDir) {
        try {
          await this.containerService.cleanup(workspaceDir);
        } catch (cleanupError) {
          this.logger.warn(`Failed to cleanup workspace ${workspaceDir}: ${cleanupError.message}`);
        }
      }
    }
  }

  private async logProgress(
    deploymentId: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
  ) {
    await this.deploymentService.appendLog(deploymentId, {
      level,
      message,
      timestamp: new Date().toISOString(),
      deploymentId,
    });
  }
}