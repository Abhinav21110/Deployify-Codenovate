import { IsString, IsOptional, IsEnum, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeploymentDto {
  @ApiProperty({
    description: 'GitHub repository URL',
    example: 'https://github.com/user/repo',
  })
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'Repository URL must be a valid HTTPS GitHub URL' },
  )
  @IsString()
  repoUrl: string;

  @ApiPropertyOptional({
    description: 'Git branch to deploy',
    example: 'main',
    default: 'main',
  })
  @IsOptional()
  @IsString()
  branch?: string = 'main';

  @ApiProperty({
    description: 'Deployment environment',
    enum: ['school', 'staging', 'prod'],
    example: 'school',
  })
  @IsEnum(['school', 'staging', 'prod'])
  environment: 'school' | 'staging' | 'prod';

  @ApiProperty({
    description: 'Budget constraint for deployment',
    enum: ['free', 'low', 'any'],
    example: 'free',
  })
  @IsEnum(['free', 'low', 'any'])
  budget: 'free' | 'low' | 'any';

  @ApiPropertyOptional({
    description: 'Preferred deployment providers',
    type: [String],
    example: ['netlify', 'vercel'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferProviders?: string[];
}

export class DeploymentResponseDto {
  @ApiProperty({
    description: 'Unique deployment identifier',
    example: 'dep_1234567890',
  })
  deploymentId: string;
}

export class DeploymentStatusDto {
  @ApiProperty({ example: 'dep_1234567890' })
  id: string;

  @ApiProperty({
    enum: ['queued', 'cloning', 'detecting', 'building', 'deploying', 'success', 'failed', 'cancelled'],
    example: 'building',
  })
  status: string;

  @ApiPropertyOptional({ example: 'netlify' })
  provider?: string;

  @ApiPropertyOptional({ example: 'https://app.netlify.com' })
  url?: string;

  @ApiPropertyOptional()
  detected?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  error?: string;
}