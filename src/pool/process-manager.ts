import { ChildProcess, fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ProcessEventType } from '../protocol/process-event-type.enum';
import {
  ProcessMessage,
  ProcessMessageExecute,
} from '../protocol/process-message.type';
import { PoolConfig } from '../types/pool-config.type';

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

export class ProcessManager {
  private child: ChildProcess;
  private pending = new Map<string, PendingRequest>();
  private options: PoolConfig;
  private readyPromise: Promise<void>;

  constructor(scriptPath: string, config: PoolConfig) {
    this.options = config;
    this.child = this.spawn(scriptPath);

    this.child.send({
      type: ProcessEventType.REGISTER,
      content: {
        threads: config.threads,
      },
    });

    this.readyPromise = this.waitUntilReady();

    this.child.on('message', (msg: ProcessMessage) => {
      this.handleMessage(msg);
    });

    this.child.on('error', (err) => {
      this.rejectAll(err);
    });

    this.child.on('exit', () => {
      this.rejectAll(new Error('Child process exited'));
    });
  }

  private spawn(scriptPath: string) {
    return fork(scriptPath, [], {
      execArgv: [`--max-old-space-size=${this.options.poolMaxMemoryMb}`],
    });
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
      this.pending.set(id, { resolve, reject });

      this.send(message);
    });
  }

  send(message: ProcessMessage) {
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
        pending.resolve(content);
        this.pending.delete(id);
      }

      return;
    }

    // if (type === ProcessEventType.ERROR && id) {
    //     const pending = this.pending.get(id)

    //     if (pending) {
    //         pending.reject(content)
    //         this.pending.delete(id)
    //     }

    //     return
    // }
  }

  private rejectAll(error: Error) {
    for (const { reject } of this.pending.values()) {
      reject(error);
    }

    this.pending.clear();
  }
}
