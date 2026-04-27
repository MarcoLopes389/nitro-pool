import { parentPort, threadId, workerData } from 'node:worker_threads';
import { WorkerEventType } from '../protocol/worker-event-type.enum';
import { TaskExecutor } from './task-executor';
import { WorkerMessage } from '../protocol/worker-message.type';
import { Logger } from '../core/logging/logger';

const taskExecutor = new TaskExecutor();

const logger = new Logger(workerData.logging, `worker:${threadId}`);

parentPort?.postMessage({
  type: WorkerEventType.READY,
  content: { ok: true },
});

parentPort?.on('message', async (message: WorkerMessage) => {
  const { content, type, id } = message;

  if (type == WorkerEventType.EXECUTE) {
    const { context, func, modules } = content;

    if (modules) {
      logger.info('loading modules for task', { taskId: id });

      taskExecutor.loadModules(modules);
    }

    try {
      logger.info('starting task', { taskId: id });

      const result = await taskExecutor.execute(func, context);

      logger.info('task completed', { taskId: id });

      parentPort?.postMessage({
        id,
        type: WorkerEventType.RESULT,
        content: result,
      });
    } catch (error) {
      logger.error('task failed', { taskId: id });

      parentPort?.postMessage({
        id,
        type: WorkerEventType.ERROR,
        content: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      });
    }
  }
});
