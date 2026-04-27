import type { NitroConfig } from '../types/nitro-config.type.js';
import { Pool } from '../pool/pool.js';
import { Randomizer } from '../utils/randomizer.js';
import { TaskFunction } from '../types/task-function.type.js';
import {
  InferModules,
  ModuleDefinition,
  ModulesMap,
} from '../types/module.type.js';
import { NitroRunOptions } from '../types/nitro-run-options.type.js';
import { PoolMetrics } from '../types/pool-metrics.type.js';

export class Nitro {
  private pools: Pool[] = [];

  constructor(config: NitroConfig) {
    this.initialize(config);
  }

  private initialize(config: NitroConfig) {
    const {
      pools,
      threads,
      poolMaxMemoryMb,
      maxPoolQueueSize,
      maxThreads,
      autoscaling,
      logging,
      smartResourcesLimiter,
      maxStep,
      minThreads,
      scaleDownQueueThreshold,
      scaleUpQueueThreshold,
      targetUtilization,
      scalingInterval,
    } = config;

    for (let i = 0; i < pools; i++) {
      const pool = new Pool({
        threads,
        poolMaxMemoryMb,
        maxPoolQueueSize,
        autoscaling,
        maxThreads,
        smartResourcesLimiter,
        logging,
        maxStep,
        minThreads,
        scaleDownQueueThreshold,
        scaleUpQueueThreshold,
        targetUtilization,
        scalingInterval,
      });

      this.pools.push(pool);
    }
  }

  private serializeModules(
    modules: readonly ModuleDefinition<any>[] | undefined,
  ): ModulesMap | undefined {
    const result: ModulesMap = {};

    if (!modules) {
      return undefined;
    }

    for (const mod of modules) {
      result[mod.name] = mod.path;
    }

    return result;
  }

  async run<TReturn, TContext, TDefs extends readonly ModuleDefinition<any>[]>(
    func: TaskFunction<TReturn, TContext, InferModules<TDefs>>,
    context?: TContext,
    options?: NitroRunOptions<TDefs>,
  ) {
    const poolIndex = Randomizer.randomIndex(this.pools.length);

    const pool = this.pools[poolIndex];

    return pool.run(func, context, {
      modules: this.serializeModules(options?.modules),
      ...options,
    });
  }

  async getMetrics(): Promise<PoolMetrics[]> {
    return Promise.all(this.pools.map((pool) => pool.getMetrics()))
  }

  finish() {
    this.pools.forEach((pool) => {
      pool.finish();
    });
  }
}
