import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('deployments')
@Index(['status'])
@Index(['createdAt'])
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  repoUrl: string;

  @Column({ type: 'varchar', length: 100, default: 'main' })
  branch: string;

  @Column({
    type: 'enum',
    enum: ['school', 'staging', 'prod'],
  })
  environment: 'school' | 'staging' | 'prod';

  @Column({
    type: 'enum',
    enum: ['free', 'low', 'any'],
  })
  budget: 'free' | 'low' | 'any';

  @Column({
    type: 'enum',
    enum: ['queued', 'cloning', 'detecting', 'building', 'deploying', 'success', 'failed', 'cancelled'],
    default: 'queued',
  })
  status: 'queued' | 'cloning' | 'detecting' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deploymentUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  detectedStack?: any;

  @Column({ type: 'jsonb', nullable: true })
  buildLogs?: any[];

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  jobId?: string;

  @Column({ type: 'varchar', array: true, nullable: true })
  preferProviders?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId?: string; // For future auth implementation

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'integer', default: 0 })
  buildDuration?: number; // seconds
}