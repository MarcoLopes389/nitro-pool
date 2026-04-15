import type { BulletTrainConfig } from "../types/bullet-train-config.type.js";
import { Pool } from "../pool/pool.js";
import { Randomizer } from "../utils/randomizer.js";
import { TaskFunction } from "../types/task-function.type.js";
import { ModulesMap, TaskRunOptions } from "../types/task-run-options.type.js";

export class BulletTrain {
    private pools: Pool[] = []

    constructor(config: BulletTrainConfig) {
        this.initialize(config)
    }

    private initialize(config: BulletTrainConfig) {
        const { 
            pools,
            threads,
            poolMaxMemory,
            maxAttempts,
            retry
        } = config

        for (let i = 0; i < pools; i++) {
            const pool = new Pool({
                threads,
                poolMaxMemory,
                maxAttempts,
                retry
            })

            this.pools.push(pool)
        }
    }

    async run<
      TReturn,
      TContext,
    >(func: TaskFunction<TReturn, TContext>, context: TContext, options: TaskRunOptions) {
        const poolIndex = Randomizer.randomIndex(this.pools.length)

        const pool = this.pools[poolIndex]

        return pool.run(func, context, options)
    }

    finish() {
        this.pools.forEach((pool) => {
            pool.finish()
        })
    }
}