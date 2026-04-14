import { WorkerEventType } from "./worker-event-type.enum"
import { WorkerExecutionMessage } from "./worker-execution-message.type"

interface ProcessMessageMap {
    [WorkerEventType.EXECUTE]: WorkerExecutionMessage
    [WorkerEventType.READY]: {
        ok: boolean
    }
    [WorkerEventType.RESULT]: unknown
}

export type WorkerMessage2 = {
  [K in WorkerEventType]: {
    id: string
    type: K
    content: ProcessMessageMap[K]
  }
}[WorkerEventType]

export type WorkerMessage = {
    type: WorkerEventType
    content: unknown
}