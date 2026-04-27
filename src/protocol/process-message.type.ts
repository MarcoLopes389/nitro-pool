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
    maxThreads?: number;
    autoscaling?: boolean;
    minThreads?: number;
    targetUtilization?: number;
    scaleUpQueueThreshold?: number;
    scaleDownQueueThreshold?: number;
    maxStep?: number;
    scalingInterval?: number;
    logging?: boolean
  };
  [ProcessEventType.READY]: {
    ok: boolean;
  };
  [ProcessEventType.RESULT]: unknown;
  [ProcessEventType.ERROR]: {
    message: string;
    stack: string;
  };
  [ProcessEventType.METRICS]: unknown
}

export type ProcessMessage = {
  [K in ProcessEventType]: {
    id: string;
    type: K;
    content: ProcessMessageMap[K];
  };
}[ProcessEventType];
