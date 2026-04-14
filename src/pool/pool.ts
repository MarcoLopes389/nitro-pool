import { PoolConfig } from "../types/pool-config.type";
import path from "node:path";
import { TaskFunction } from "../types/task-function.type";
import { ProcessManager } from "./process-manager";

export class Pool {
    private processManager: ProcessManager

    constructor(config: PoolConfig) {
        this.processManager = new ProcessManager(
            path.resolve(__dirname, '../child/pool-script'), 
            config
        )
    }

    finish() {
        this.processManager.kill()
    }

    async run<T, Y>(func: TaskFunction<T, Y>, context: Y) {
        return this.processManager.execute({
            func: func.toString(),
            context
        })
    }
}