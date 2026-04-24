import { Worker } from 'node:worker_threads';
import { WorkerWrapper } from './worker-wrapper';
import { WorkerEventType } from '../protocol/worker-event-type.enum';
import { WorkerMessage } from '../protocol/worker-message.type';
import { WorkerPoolConfig } from '../types/worker-pool-config.type';
import { TaskPriority } from '../enums/task-priority.enum';

type Callbacks = {
  onReady: () => void;
  onResult: (message: WorkerMessage) => void;
  onError: (message: WorkerMessage) => void;
};

export class WorkerPool {
  private workers: WorkerWrapper[] = [];
  private queues: Record<TaskPriority, WorkerMessage[]> = {
    [TaskPriority.HIGH]: [],
    [TaskPriority.NORMAL]: [],
    [TaskPriority.LOW]: [],
  };
  private queueSize = 0;

  constructor(private config: WorkerPoolConfig) {}

  initialize(workerScriptPath: string, callbacks: Callbacks) {
    for (let i = 0; i < this.config.threads; i++) {
      const worker = new Worker(workerScriptPath);
      const wrapper = new WorkerWrapper(worker);

      wrapper.onMessage((message, workerRef) => {
        this.handleWorkerMessage(message, workerRef, callbacks);
      });

      wrapper.onError((err) => {
        console.error('worker error:', err);
      });

      wrapper.onExit((code) => {
        console.log('worker exit:', code);
      });

      this.workers.push(wrapper);
    }
  }

  execute(task: WorkerMessage) {
    const { type, content } = task

    if (type != WorkerEventType.EXECUTE) {
      throw new Error('Only execution is allowed from this side')
    }

    const worker = this.getAvailableWorker();

    if (worker) {
      worker.execute(task);
      return;
    }

    const priority = content.priority ?? TaskPriority.NORMAL;

    if (
      this.config.maxPoolQueueSize &&
      this.queueSize >= this.config.maxPoolQueueSize
    ) {
      throw new Error('Queue limit reached');
    }

    this.queues[priority].push(task);

    this.queueSize++;
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

  private getNextTask(): WorkerMessage | null {
    if (this.queues[TaskPriority.HIGH].length > 0) {
      return this.queues[TaskPriority.HIGH].shift()!;
    }

    if (this.queues[TaskPriority.NORMAL].length > 0) {
      return this.queues[TaskPriority.NORMAL].shift()!;
    }

    if (this.queues[TaskPriority.LOW].length > 0) {
      return this.queues[TaskPriority.LOW].shift()!;
    }

    return null;
  }

  private dispatchNext() {
    const worker = this.getAvailableWorker();
    if (!worker) return;

    const nextTask = this.getNextTask();
    if (!nextTask) return;

    worker.execute(nextTask);

    this.queueSize--
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
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
