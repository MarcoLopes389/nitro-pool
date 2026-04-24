export type PoolConfig = {
  threads: number;
  poolMaxMemoryMb?: number;
  maxAttempts?: number;
  retry?: boolean;
  maxPoolQueueSize?: number;
  autoscaling?: boolean;
  scalingInterval?: number
  smartResourcesLimiter?: boolean;
  maxThreads?: number;
  logging?: boolean;
  minThreads?: number;
  targetUtilization?: number;
  scaleUpQueueThreshold?: number;
  scaleDownQueueThreshold?: number;
  maxStep?: number;
};
