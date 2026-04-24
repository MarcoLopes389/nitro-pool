export type PoolConfig = {
  threads: number;
  poolMaxMemoryMb?: number;
  maxAttempts?: number;
  retry?: boolean;
  maxPoolQueueSize?: number;
  autoscaling?: boolean;
  smartResourcesLimiter?: boolean;
};
