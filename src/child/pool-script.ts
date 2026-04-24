import path from 'node:path';
import { ProcessMessage } from '../protocol/process-message.type';
import { ProcessEventType } from '../protocol/process-event-type.enum';
import { WorkerPool } from './worker-pool';
import { WorkerEventType } from '../protocol/worker-event-type.enum';

let workerPool: WorkerPool;

process.on('message', (message: ProcessMessage) => {
  const { type, content, id } = message;

  switch (type) {
    case ProcessEventType.REGISTER:
      const { threads, maxPoolQueueSize } = content;

      workerPool = new WorkerPool({
        threads,
        maxPoolQueueSize,
      });

      workerPool.initialize(
        path.resolve(__dirname, '../worker/worker-script'),
        {
          onReady: () => {
            if (process.connected) {
              process.send?.({
                type: ProcessEventType.READY,
                content,
              });
            }
          },
          onResult: (message) => {
            process.send?.({
              type: ProcessEventType.RESULT,
              content: message.content,
              id: message.id,
            });
          },
          onError: (message) => {
            process.send?.({
              type: ProcessEventType.ERROR,
              content: message.content,
              id: message.id,
            });
          },
        },
      );
      break;
    case ProcessEventType.EXECUTE:
      try {
        workerPool.execute({
          content,
          id,
          type: WorkerEventType.EXECUTE,
        });
      } catch (error) {
        process.send?.({
          type: ProcessEventType.ERROR,
          content: {
            stack: (error as Error).stack,
            message: (error as Error).message,
          },
          id,
        });
      }

      break;
  }
});

process.on('exit', async () => {
  await workerPool.terminateAll();
});
