export type NitroConfig = {
  threads: number;
  pools: number;
  poolMaxMemoryMb?: number;
  logging?: boolean;
  maxPoolQueueSize?: number;
  autoscaling?: boolean;
  scalingInterval?: number;
  smartResourcesLimiter?: boolean;
  maxThreads?: number;
  minThreads?: number;
  targetUtilization?: number;
  scaleUpQueueThreshold?: number;
  scaleDownQueueThreshold?: number;
  maxStep?: number;
};
