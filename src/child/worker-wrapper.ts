import { Worker } from 'node:worker_threads';
import { WorkerState } from '../protocol/worker-state.enum';
import { WorkerEventType } from '../protocol/worker-event-type.enum';
import { WorkerMessage } from '../protocol/worker-message.type';

export class WorkerWrapper {
  public readonly instance: Worker;
  private state: WorkerState = WorkerState.WAITING;

  constructor(worker: Worker) {
    this.instance = worker;
  }

  isReady() {
    return this.state === WorkerState.READY;
  }

  isBusy() {
    return this.state === WorkerState.BUSY;
  }

  markReady() {
    this.state = WorkerState.READY;
  }

  markBusy() {
    this.state = WorkerState.BUSY;
  }

  execute(task: WorkerMessage) {
    if (!this.isReady()) {
      throw new Error('Worker is not ready');
    }

    this.markBusy();
    this.instance.postMessage(task);
  }

  onMessage(handler: (message: WorkerMessage, worker: WorkerWrapper) => void) {
    this.instance.on('message', (message: WorkerMessage) => {
      if (message.type === WorkerEventType.RESULT) {
        this.markReady();
      }

      handler(message, this);
    });
  }

  onError(handler: (err: Error) => void) {
    this.instance.on('error', handler);
  }

  onExit(handler: (code: number) => void) {
    this.instance.on('exit', handler);
  }

  async terminate() {
    await this.instance.terminate();
  }
}
