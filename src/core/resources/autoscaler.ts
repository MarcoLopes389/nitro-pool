import { AutoScalerConfig } from '../../types/auto-scaler-config.type';
import { PoolMetrics } from '../../types/pool-metrics.type';

export class AutoScaler {
  constructor(private config: AutoScalerConfig) {}

  evaluate(metrics: PoolMetrics): number {
    const {
      queueSize,
      totalWorkers,
      avgExecutionDurationInSeconds,
      avgNewTasksPerSecond,
    } = metrics;

    if (avgExecutionDurationInSeconds <= 0) return 0;

    const maxStep = this.config.maxStep ?? 2;
    const target = this.config.targetUtilization ?? 0.75;

    const scaleUpQueueThreshold = this.config.scaleUpQueueThreshold ?? 2;
    const scaleDownQueueThreshold = this.config.scaleDownQueueThreshold ?? 0;

    const workerThroughput = 1 / avgExecutionDurationInSeconds;

    const currentCapacity = totalWorkers * workerThroughput;

    const effectiveCapacity = currentCapacity * target;

    if (
      avgNewTasksPerSecond > effectiveCapacity &&
      queueSize >= scaleUpQueueThreshold
    ) {
      const neededWorkers = Math.ceil(
        avgNewTasksPerSecond / (workerThroughput * target),
      );

      let diff = neededWorkers - totalWorkers;

      diff = Math.min(diff, maxStep);

      if (this.config.maxThreads !== undefined) {
        diff = Math.min(diff, this.config.maxThreads - totalWorkers);
      }

      return diff > 0 ? diff : 0;
    }

    if (
      avgNewTasksPerSecond < currentCapacity * 0.5 &&
      queueSize <= scaleDownQueueThreshold
    ) {
      const idealWorkers = Math.ceil(avgNewTasksPerSecond / workerThroughput);

      let diff = totalWorkers - idealWorkers;

      diff = Math.min(diff, maxStep);

      if (this.config.minThreads !== undefined) {
        diff = Math.min(diff, totalWorkers - this.config.minThreads);
      }

      return diff > 0 ? -diff : 0;
    }

    return 0;
  }
}
