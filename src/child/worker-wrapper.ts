import { Worker } from 'node:worker_threads';
import { WorkerState } from '../protocol/worker-state.enum';
import { WorkerMessage } from '../protocol/worker-message.type';

export class WorkerWrapper {
  public readonly instance: Worker;
  private state: WorkerState = WorkerState.WAITING;
  private startExecution: number = 0;

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

    this.startExecution = Date.now();
    this.markBusy();
    this.instance.postMessage(task);
  }

  onMessage(handler: (message: WorkerMessage, worker: WorkerWrapper) => void) {
    this.instance.on('message', (message: WorkerMessage) => {
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

  getStartExecution() {
    return this.startExecution;
  }
}
