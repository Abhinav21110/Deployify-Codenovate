import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DeploymentWorker } from './deployment.worker';
import { StackDetectionService } from './stack-detection.service';
import { ContainerService } from './container.service';
import { ProviderModule } from '../provider/provider.module';
import { DeploymentModule } from '../deployment/deployment.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'deployment',
    }),
    ProviderModule,
    DeploymentModule,
  ],
  providers: [
    DeploymentWorker,
    StackDetectionService,
    ContainerService,
  ],
  exports: [
    StackDetectionService,
    ContainerService,
  ],
})
export class WorkerModule {}