import { parentPort } from 'node:worker_threads'
import { WorkerEventType } from '../protocol/worker-event-type.enum'
import { TaskExecutor } from './task-executor'
import { WorkerMessage2 } from '../protocol/worker-message.type'

parentPort?.postMessage({
    type: WorkerEventType.READY,
    content: { ok: true }
})

parentPort?.on('message', (message: WorkerMessage2) => {
    const { content, type, id } = message

    if (type == WorkerEventType.EXECUTE) {
        const { context, func } = content

        const result = TaskExecutor.execute(func, context)

        parentPort?.postMessage({
            id,
            type: WorkerEventType.RESULT,
            content: result
        })
    }
})