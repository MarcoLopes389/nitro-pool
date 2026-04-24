import { TaskPriority } from '../enums/task-priority.enum';

export type NitroRunOptions<T> = {
  modules?: T;
  timeout?: number;
  priority?: TaskPriority;
};
