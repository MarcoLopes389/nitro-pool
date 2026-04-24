export class RuntimeMeter {
  private completedTasks = 0;
  private totalExecutionTime = 0;

  private arrivals: number[] = [];

  recordExecution(durationMs: number) {
    this.completedTasks++;
    this.totalExecutionTime += durationMs;
  }

  recordArrival() {
    this.arrivals.push(Date.now());
  }

  getAvgExecutionTime(): number {
    if (this.completedTasks === 0) return 0;
    return this.totalExecutionTime / 1000 / this.completedTasks;
  }

  getCompletedTasks(): number {
    return this.completedTasks;
  }

  getArrivalRate(): number {
    const metricWindow = 5000;
    const now = Date.now();

    this.arrivals = this.arrivals.filter((time) => now - time <= metricWindow);

    return this.arrivals.length / (metricWindow / 1000);
  }
}
