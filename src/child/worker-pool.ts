import { Worker } from 'node:worker_threads';
import { WorkerWrapper } from './worker-wrapper';
import { WorkerEventType } from '../protocol/worker-event-type.enum';
import { WorkerMessage } from '../protocol/worker-message.type';

type Callbacks = {
  onReady: () => void;
  onResult: (message: WorkerMessage) => void;
  onError: (message: WorkerMessage) => void;
};

export class WorkerPool {
  private workers: WorkerWrapper[] = [];
  private queue: WorkerMessage[] = [];

  constructor(private threads: number) {}

  initialize(workerScriptPath: string, callbacks: Callbacks) {
    for (let i = 0; i < this.threads; i++) {
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
    const worker = this.getAvailableWorker();

    if (worker) {
      worker.execute(task);
      return;
    }

    this.queue.push(task);
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
        worker.markReady()

        callbacks.onError(message)

        this.dispatchNext()
        
        break
    }
  }

  private dispatchNext() {
    if (this.queue.length === 0) return;

    const worker = this.getAvailableWorker();
    if (!worker) return;

    const nextTask = this.queue.shift()!;
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
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
