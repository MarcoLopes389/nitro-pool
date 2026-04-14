import type { BulletTrainConfig } from "../types/bullet-train-config.type.js";
import { Pool } from "../pool/pool.js";
import { Randomizer } from "../utils/randomizer.js";
import { TaskFunction } from "../types/task-function.type.js";

export class BulletTrain {
    private pools: Pool[] = []

    constructor(config: BulletTrainConfig) {
        this.initialize(config)
    }

    private initialize(config: BulletTrainConfig) {
        const { pools, threads } = config

        for (let i = 0; i < pools; i++) {
            const pool = new Pool({
                threads
            })

            this.pools.push(pool)
        }
    }

    async run<T, Y>(func: TaskFunction<T, Y>, context: Y) {
        const poolIndex = Randomizer.randomIndex(this.pools.length)

        const pool = this.pools[poolIndex]

        return pool.run(func, context)
    }

    finish() {
        this.pools.forEach((pool) => {
            pool.finish()
        })
    }
}