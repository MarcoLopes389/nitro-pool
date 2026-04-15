import { ModulesMap } from "../types/task-run-options.type"
import { ProcessEventType } from "./process-event-type.enum"

export type ProcessMessageExecute = {
    func: string
    context: unknown
    modules?: ModulesMap
}

interface ProcessMessageMap {
    [ProcessEventType.EXECUTE]: ProcessMessageExecute
    [ProcessEventType.REGISTER]: {
        threads: number
    }
    [ProcessEventType.READY]: {
        ok: boolean
    }
    [ProcessEventType.RESULT]: unknown
}

export type ProcessMessage = {
  [K in ProcessEventType]: {
    id: string
    type: K
    content: ProcessMessageMap[K]
  }
}[ProcessEventType]