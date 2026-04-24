export type PoolMetrics = {
  queueSize: number;
  totalWorkers: number;
  idleWorkers: number;
  busyWorkers: number;
  avgNewTasksPerSecond: number;
  avgExecutionDurationInSeconds: number;
};
