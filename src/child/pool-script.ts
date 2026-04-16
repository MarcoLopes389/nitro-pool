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
      const { threads } = content;

      workerPool = new WorkerPool(threads);

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
          onError: () => {},
        },
      );
      break;
    case ProcessEventType.EXECUTE:
      workerPool.execute({
        content,
        id,
        type: WorkerEventType.EXECUTE,
      });

      break;
  }
});

process.on('exit', async () => {
  await workerPool.terminateAll();
});
