export type WorkerPoolConfig = {
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
};
