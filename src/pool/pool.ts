import { PoolConfig } from '../types/pool-config.type';
import path from 'node:path';
import { TaskFunction } from '../types/task-function.type';
import { ProcessManager } from './process-manager';
import { PoolRunOptions } from '../types/pool-run-options.type';

export class Pool {
  private processManager: ProcessManager;

  constructor(config: PoolConfig) {
    this.processManager = new ProcessManager(
      path.resolve(__dirname, '../child/pool-script'),
      config,
    );
  }

  finish() {
    this.processManager.kill();
  }

  async run<T, Y, M>(
    func: TaskFunction<T, Y, M>,
    context?: Y,
    options?: PoolRunOptions,
  ) {
    return this.processManager.execute({
      func: func.toString(),
      context,
      modules: options?.modules,
      timeout: options?.timeout,
      priority: options?.priority,
    });
  }
}
