import { Module } from '@nestjs/common';
import { NetlifyService } from './netlify.service';
import { VercelService } from './vercel.service';
import { DigitalOceanService } from './digitalocean.service';
import { AwsAmplifyService } from './aws-amplify.service';
import { LocalService } from './local.service';
import { ProviderDecisionService } from './provider-decision.service';

@Module({
  providers: [
    NetlifyService,
    VercelService,
    DigitalOceanService,
    AwsAmplifyService,
    LocalService,
    ProviderDecisionService,
  ],
  exports: [
    NetlifyService,
    VercelService,
    DigitalOceanService,
    AwsAmplifyService,
    LocalService,
    ProviderDecisionService,
  ],
})
export class ProviderModule {}