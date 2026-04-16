import { ModulesMap } from '../types/module.type';
import { WorkerEventType } from './worker-event-type.enum';

export type WorkerExecutionMessage = {
  context: unknown;
  func: string;
  modules?: ModulesMap;
};

interface WorkerMessageContentMap {
  [WorkerEventType.EXECUTE]: WorkerExecutionMessage;
  [WorkerEventType.READY]: {
    ok: boolean;
  };
  [WorkerEventType.RESULT]: unknown;
  [WorkerEventType.ERROR]: unknown;
}

export type WorkerMessage = {
  [K in WorkerEventType]: {
    id: string;
    type: K;
    content: WorkerMessageContentMap[K];
  };
}[WorkerEventType];
