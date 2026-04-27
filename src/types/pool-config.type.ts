export type PoolConfig = {
  threads: number;
  poolMaxMemoryMb?: number;
  maxPoolQueueSize?: number;
  autoscaling?: boolean;
  scalingInterval?: number;
  smartResourcesLimiter?: boolean;
  maxThreads?: number;
  logging?: boolean;
  minThreads?: number;
  targetUtilization?: number;
  scaleUpQueueThreshold?: number;
  scaleDownQueueThreshold?: number;
  maxStep?: number;
};
