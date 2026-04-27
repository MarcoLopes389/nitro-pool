import { ChildProcess, fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ProcessEventType } from '../protocol/process-event-type.enum';
import {
  ProcessMessage,
  ProcessMessageExecute,
} from '../protocol/process-message.type';
import { PoolConfig } from '../types/pool-config.type';
import { Logger } from '../core/logging/logger';
import { PoolMetrics } from '../types/pool-metrics.type';

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout?: NodeJS.Timeout;
};

export class ProcessManager {
  private child: ChildProcess;
  private pending = new Map<string, PendingRequest>();
  private options: PoolConfig;
  private logger: Logger;
  private readyPromise: Promise<void>;

  constructor(scriptPath: string, config: PoolConfig) {
    this.options = config;
    this.logger = new Logger('process-manager');
    this.child = this.spawn(scriptPath);

    this.child.send({
      type: ProcessEventType.REGISTER,
      content: {
        threads: config.threads,
        maxPoolQueueSize: config.maxPoolQueueSize,
        maxThreads: config.maxThreads,
        autoscaling: config.autoscaling,
        minThreads: config.minThreads,
        targetUtilization: config.targetUtilization,
        scaleUpQueueThreshold: config.scaleUpQueueThreshold,
        scaleDownQueueThreshold: config.scaleDownQueueThreshold,
        maxStep: config.maxStep,
        scalingInterval: config.scalingInterval,
      },
    });

    this.readyPromise = this.waitUntilReady();

    this.child.on('message', (msg: ProcessMessage) => {
      this.handleMessage(msg);
    });

    this.child.on('error', (error) => {
      this.logger.error('an error ocurred in child process, rejecting all', {
        error,
      });
      this.rejectAll(error);
    });

    this.child.on('exit', () => {
      this.logger.warn('the child process exitted, rejecting all');
      this.rejectAll(new Error('Child process exited'));
    });
  }

  private spawn(scriptPath: string) {
    const args: string[] = [];

    if (this.options.poolMaxMemoryMb) {
      args.push(`--max-old-space-size=${this.options.poolMaxMemoryMb}`);
    }

    return fork(scriptPath, [], {
      execArgv: args,
    });
  }

  async getMetrics(): Promise<PoolMetrics> {
    return new Promise((resolve, reject) => {
      const id = randomUUID()

      this.pending.set(id, { resolve, reject });

      this.send({
        id,
        type: ProcessEventType.METRICS,
        content: {}
      })
    })
  }

  async execute<T>(content: ProcessMessageExecute): Promise<T> {
    await this.readyPromise;

    const id = randomUUID();

    const message: ProcessMessage = {
      id,
      type: ProcessEventType.EXECUTE,
      content,
    };

    return new Promise<T>((resolve, reject) => {
      const pending: PendingRequest = { resolve, reject };

      if (content.timeout) {
        const timeout = setTimeout(() => {
          const error = new Error(`Task timeout after ${content.timeout}ms`);

          this.pending.delete(id);

          reject(error);
        }, content.timeout);

        pending.timeout = timeout;
      }

      this.pending.set(id, pending);

      this.send(message);
    });
  }

  private send(message: ProcessMessage) {
    if (!this.child.connected) {
      throw new Error('Child process is not connected');
    }

    this.child.send(message);
  }

  kill() {
    this.child.kill();
  }

  private async waitUntilReady(): Promise<void> {
    return new Promise((resolve) => {
      this.child.once('message', (msg: ProcessMessage) => {
        if (msg.type === ProcessEventType.READY) {
          resolve();
        }
      });
    });
  }

  private handleMessage(msg: ProcessMessage) {
    const { type, content, id } = msg;

    if (type === ProcessEventType.RESULT && id) {
      const pending = this.pending.get(id);

      if (pending) {
        if (pending.timeout) {
          clearTimeout(pending.timeout);
        }

        pending.resolve(content);
        this.pending.delete(id);
      }

      return;
    }

    if (type === ProcessEventType.ERROR && id) {
      const pending = this.pending.get(id);

      if (pending) {
        if (pending.timeout) {
          clearTimeout(pending.timeout);
        }

        const error = new Error(content.message);
        error.stack = content.stack;

        pending.reject(error);
        this.pending.delete(id);
      }

      return;
    }

    if (type === ProcessEventType.METRICS && id) {
      const pending = this.pending.get(id);

      if (pending) {
        pending.resolve(content);
        this.pending.delete(id);
      }

      return;
    }
  }

  private rejectAll(error: Error) {
    for (const { reject } of this.pending.values()) {
      reject(error);
    }

    this.pending.clear();
  }
}
