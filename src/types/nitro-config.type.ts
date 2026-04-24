export type NitroConfig = {
  threads: number;
  pools: number;
  poolMaxMemoryMb?: number;
  maxAttempts?: number;
  retry?: boolean;
  maxPoolQueueSize?: number;
  autoscaling?: boolean;
  smartResourcesLimiter?: boolean;
};
