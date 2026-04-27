import { Worker } from 'node:worker_threads';
import { WorkerWrapper } from './worker-wrapper';
import { WorkerEventType } from '../protocol/worker-event-type.enum';
import { WorkerMessage } from '../protocol/worker-message.type';
import { TaskPriority } from '../enums/task-priority.enum';
import { WorkerPoolConfig } from '../types/worker-pool-config.type';
import { PoolMetrics } from '../types/pool-metrics.type';
import { Scheduler } from '../core/resources/scheduler';
import { RuntimeMeter } from '../core/resources/runtime-meter';
import { AutoScaler } from '../core/resources/autoscaler';
import { Logger } from '../core/logging/logger';

type Callbacks = {
  onReady: () => void;
  onResult: (message: WorkerMessage) => void;
  onError: (message: WorkerMessage) => void;
};

export class WorkerPool {
  private workerScriptPath: string = '';
  private workers: WorkerWrapper[] = [];
  private scheduler: Scheduler;
  private runtimeMeter: RuntimeMeter;
  private autoscaler: AutoScaler;
  private logger: Logger;
  private scaleInterval: NodeJS.Timeout | undefined;

  constructor(private config: WorkerPoolConfig) {
    this.scheduler = new Scheduler();
    this.autoscaler = new AutoScaler({
      maxStep: config.maxStep,
      maxThreads: config.maxThreads,
      minThreads: config.minThreads,
      scaleDownQueueThreshold: config.scaleDownQueueThreshold,
      scaleUpQueueThreshold: config.scaleUpQueueThreshold,
      targetUtilization: config.targetUtilization,
    });
    this.runtimeMeter = new RuntimeMeter();
    this.logger = new Logger(config.logging, 'worker-pool');
  }

  initialize(workerScriptPath: string, callbacks: Callbacks) {
    this.workerScriptPath = workerScriptPath;

    for (let i = 0; i < this.config.threads; i++) {
      this.addWorker(callbacks);
    }

    if (this.config.autoscaling) {
      this.startAutoScaling(callbacks);
    }
  }

  private removeWorker() {
    const worker = this.workers.find((w) => w.isReady());

    if (!worker) return;

    worker.terminate();

    this.workers = this.workers.filter((w) => w !== worker);
  }

  private addWorker(callbacks: Callbacks) {
    const worker = new Worker(this.workerScriptPath, { workerData: { logging: this.config.logging } });
    const wrapper = new WorkerWrapper(worker);

    wrapper.onMessage((message, workerRef) => {
      if (message.type === WorkerEventType.RESULT) {
        const duration = Date.now() - workerRef.getStartExecution();

        this.runtimeMeter.recordExecution(duration);
      }

      this.handleWorkerMessage(message, workerRef, callbacks);
    });

    wrapper.onError((error) => {
      this.logger.error('worker error:', { error });
    });

    wrapper.onExit((code) => {
      this.logger.info('worker exit:', { code });
    });

    this.workers.push(wrapper);
  }

  private startAutoScaling(callbacks: Callbacks) {
    this.scaleInterval = setInterval(() => {
      const metrics = this.getMetrics();

      const decision = this.autoscaler.evaluate(metrics);

      if (decision > 0) {
        for (let i = 0; i < decision; i++) {
          this.logger.info('scaling pool adding 1 new worker');
          this.addWorker(callbacks);
        }
      }

      if (decision < 0) {
        for (let i = 0; i < Math.abs(decision); i++) {
          this.logger.info('down scaling pool removing 1 worker');
          this.removeWorker();
        }
      }
    }, this.config.scalingInterval ?? 1000);
  }

  getMetrics(): PoolMetrics {
    const idleWorkers = this.workers.filter((w) => w.isReady()).length;
    const busyWorkers = this.workers.filter((w) => w.isBusy()).length;

    return {
      idleWorkers,
      busyWorkers,
      queueSize: this.scheduler.size(),
      totalWorkers: this.workers.length,
      avgNewTasksPerSecond: this.runtimeMeter.getArrivalRate(),
      avgExecutionDurationInSeconds: this.runtimeMeter.getAvgExecutionTime(),
    };
  }

  execute(task: WorkerMessage) {
    const { type, content } = task;

    if (type != WorkerEventType.EXECUTE) {
      throw new Error('Only execution is allowed from this side');
    }

    this.runtimeMeter.recordArrival();

    const worker = this.getAvailableWorker();

    if (worker) {
      worker.execute(task);
      return;
    }

    const priority = content.priority ?? TaskPriority.NORMAL;

    if (
      this.config.maxPoolQueueSize &&
      this.scheduler.size() >= this.config.maxPoolQueueSize
    ) {
      throw new Error('Queue limit reached');
    }

    this.scheduler.enqueue(task, priority);
  }

  private handleWorkerMessage(
    message: WorkerMessage,
    worker: WorkerWrapper,
    callbacks: Callbacks,
  ) {
    switch (message.type) {
      case WorkerEventType.READY:
        worker.markReady();

        if (this.allWorkersReady()) {
          callbacks.onReady();
        }

        break;

      case WorkerEventType.RESULT:
        worker.markReady();

        callbacks.onResult(message);

        this.dispatchNext();

        break;

      case WorkerEventType.ERROR:
        worker.markReady();

        callbacks.onError(message);

        this.dispatchNext();

        break;
    }
  }

  private dispatchNext() {
    const worker = this.getAvailableWorker();
    if (!worker) return;

    const nextTask = this.scheduler.dequeue();
    if (!nextTask) return;

    worker.execute(nextTask);
  }

  private getAvailableWorker(): WorkerWrapper | null {
    for (const worker of this.workers) {
      if (worker.isReady()) {
        return worker;
      }
    }

    return null;
  }

  private allWorkersReady() {
    return this.workers.length > 0 && this.workers.every((w) => w.isReady());
  }

  async terminateAll() {
    if (this.scaleInterval) {
      clearInterval(this.scaleInterval);
    }

    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
