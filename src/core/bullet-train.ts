import type { BulletTrainConfig } from '../types/bullet-train-config.type.js';
import { Pool } from '../pool/pool.js';
import { Randomizer } from '../utils/randomizer.js';
import { TaskFunction } from '../types/task-function.type.js';
import {
  InferModules,
  ModuleDefinition,
  ModulesMap,
} from '../types/module.type.js';

export class BulletTrain {
  private pools: Pool[] = [];

  constructor(config: BulletTrainConfig) {
    this.initialize(config);
  }

  private initialize(config: BulletTrainConfig) {
    const { pools, threads, poolMaxMemoryMb, maxAttempts, retry } = config;

    for (let i = 0; i < pools; i++) {
      const pool = new Pool({
        threads,
        poolMaxMemoryMb,
        maxAttempts,
        retry,
      });

      this.pools.push(pool);
    }
  }

  private serializeModules(
    modules: readonly ModuleDefinition<any>[],
  ): ModulesMap {
    const result: ModulesMap = {};

    for (const mod of modules) {
      result[mod.name] = mod.path;
    }

    return result;
  }

  async run<TReturn, TContext, TDefs extends readonly ModuleDefinition<any>[]>(
    func: TaskFunction<TReturn, TContext, InferModules<TDefs>>,
    context: TContext,
    options: {
      modules: TDefs;
    },
  ) {
    const poolIndex = Randomizer.randomIndex(this.pools.length);

    const pool = this.pools[poolIndex];

    return pool.run(func, context, {
      modules: this.serializeModules(options.modules),
    });
  }

  finish() {
    this.pools.forEach((pool) => {
      pool.finish();
    });
  }
}
