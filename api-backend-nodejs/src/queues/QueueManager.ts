/**
 * Queue Manager
 * Centralized queue management using Bull Queue with Redis
 */

import Bull = require('bull');
import { getBullRedisConfig } from '../config/redis';
import { env, isDevelopment } from '../config/env';

export interface QueueJobData {
  [key: string]: any;
}

export interface QueueOptions {
  attempts?: number;
  delay?: number;
  backoff?: {
    type: string;
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

export class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, Bull.Queue> = new Map();
  private redisConfig: any;

  private constructor() {
    this.redisConfig = getBullRedisConfig();
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Create or get a queue
   */
  public getQueue(name: string): Bull.Queue {
    if (!this.queues.has(name)) {
      const queue = new Bull(name, {
        redis: this.redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
        },
      });

      // Add event listeners for monitoring
      this.setupQueueEventListeners(queue, name);
      
      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  /**
   * Add a job to a queue
   */
  public async addJob(
    queueName: string,
    jobName: string,
    data: QueueJobData,
    options?: QueueOptions
  ): Promise<Bull.Job> {
    const queue = this.getQueue(queueName);
    
    const jobOptions: Bull.JobOptions = {
      attempts: options?.attempts || 3,
      delay: options?.delay || 0,
      backoff: options?.backoff || {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: options?.removeOnComplete || 10,
      removeOnFail: options?.removeOnFail || 5,
    };

    const job = await queue.add(jobName, data, jobOptions);
    
    if (isDevelopment) {
      console.log(`📋 Job added to queue: ${queueName}/${jobName} (ID: ${job.id})`);
    }

    return job;
  }

  /**
   * Process jobs in a queue
   */
  public processJobs(
    queueName: string,
    jobName: string,
    processor: Bull.ProcessCallbackFunction<any> | Bull.ProcessPromiseFunction<any>,
    concurrency?: number
  ): void {
    const queue = this.getQueue(queueName);
    queue.process(jobName, concurrency || 1, processor);
    
    if (isDevelopment) {
      console.log(`🔄 Processing jobs: ${queueName}/${jobName} (concurrency: ${concurrency || 1})`);
    }
  }

  /**
   * Setup event listeners for queue monitoring
   */
  private setupQueueEventListeners(queue: Bull.Queue, queueName: string): void {
    queue.on('completed', (job) => {
      if (isDevelopment) {
        console.log(`✅ Job completed: ${queueName}/${job.name} (ID: ${job.id})`);
      }
    });

    queue.on('failed', (job, err) => {
      console.error(`❌ Job failed: ${queueName}/${job.name} (ID: ${job.id})`, err);
    });

    queue.on('stalled', (job) => {
      console.warn(`⚠️ Job stalled: ${queueName}/${job.name} (ID: ${job.id})`);
    });

    queue.on('progress', (job, progress) => {
      if (isDevelopment) {
        console.log(`📊 Job progress: ${queueName}/${job.name} (ID: ${job.id}) - ${progress}%`);
      }
    });

    queue.on('waiting', (jobId) => {
      if (isDevelopment) {
        console.log(`⏳ Job waiting: ${queueName} (ID: ${jobId})`);
      }
    });

    queue.on('active', (job) => {
      if (isDevelopment) {
        console.log(`🔄 Job active: ${queueName}/${job.name} (ID: ${job.id})`);
      }
    });
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Clean up completed and failed jobs
   */
  public async cleanQueue(queueName: string, grace: number = 5000): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
  }

  /**
   * Close all queues
   */
  public async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
    console.log('🔒 All queues closed');
  }

  /**
   * Pause a queue
   */
  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    console.log(`⏸️ Queue paused: ${queueName}`);
  }

  /**
   * Resume a queue
   */
  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    console.log(`▶️ Queue resumed: ${queueName}`);
  }
}

// Export singleton instance
export const queueManager = QueueManager.getInstance();
