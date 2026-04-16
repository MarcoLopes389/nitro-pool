import { parentPort } from 'node:worker_threads';
import { WorkerEventType } from '../protocol/worker-event-type.enum';
import { TaskExecutor } from './task-executor';
import { WorkerMessage } from '../protocol/worker-message.type';

const taskExecutor = new TaskExecutor();

parentPort?.postMessage({
  type: WorkerEventType.READY,
  content: { ok: true },
});

parentPort?.on('message', async (message: WorkerMessage) => {
  const { content, type, id } = message;

  if (type == WorkerEventType.EXECUTE) {
    const { context, func, modules } = content;

    if (modules) {
      taskExecutor.loadModules(modules);
    }

    try {
      const result = await taskExecutor.execute(func, context);

      parentPort?.postMessage({
        id,
        type: WorkerEventType.RESULT,
        content: result,
      });
    } catch (error) {
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
