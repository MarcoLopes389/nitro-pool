export type BulletTrainConfig = {
  threads: number;
  pools: number;
  poolMaxMemoryMb: number;
  maxAttempts: number;
  retry: boolean;
};
