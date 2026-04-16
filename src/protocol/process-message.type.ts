import { ModulesMap } from '../types/module.type';
import { ProcessEventType } from './process-event-type.enum';

export type ProcessMessageExecute = {
  func: string;
  context: unknown;
  modules?: ModulesMap;
};

interface ProcessMessageMap {
  [ProcessEventType.EXECUTE]: ProcessMessageExecute;
  [ProcessEventType.REGISTER]: {
    threads: number;
  };
  [ProcessEventType.READY]: {
    ok: boolean;
  };
  [ProcessEventType.RESULT]: unknown;
  [ProcessEventType.ERROR]: {
    message: string
    stack: string
  };
}

export type ProcessMessage = {
  [K in ProcessEventType]: {
    id: string;
    type: K;
    content: ProcessMessageMap[K];
  };
}[ProcessEventType];
