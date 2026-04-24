import { TaskPriority } from '../enums/task-priority.enum';
import { ModulesMap } from '../types/module.type';
import { ProcessEventType } from './process-event-type.enum';

export type ProcessMessageExecute = {
  func: string;
  context: unknown;
  modules?: ModulesMap;
  timeout?: number;
  priority?: TaskPriority;
};

interface ProcessMessageMap {
  [ProcessEventType.EXECUTE]: ProcessMessageExecute;
  [ProcessEventType.REGISTER]: {
    threads: number;
    maxPoolQueueSize?: number;
  };
  [ProcessEventType.READY]: {
    ok: boolean;
  };
  [ProcessEventType.RESULT]: unknown;
  [ProcessEventType.ERROR]: {
    message: string;
    stack: string;
  };
}

export type ProcessMessage = {
  [K in ProcessEventType]: {
    id: string;
    type: K;
    content: ProcessMessageMap[K];
  };
}[ProcessEventType];
