import { createContext, runInContext } from "vm"

export class TaskExecutor {
    static execute(func: string, context: unknown): unknown {
        const contextfied = createContext({
            context,
            console,
        })

        const result = runInContext(`
            const func = ${func}
            func(context)
        `, contextfied)

        return result
    }
}