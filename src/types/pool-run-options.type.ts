import { TaskPriority } from '../enums/task-priority.enum';
import { ModulesMap } from './module.type';

export type PoolRunOptions = {
  modules?: ModulesMap;
  timeout?: number;
  priority?: TaskPriority;
};
