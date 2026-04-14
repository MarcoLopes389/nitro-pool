import { Worker } from "node:worker_threads"
import { WorkerState } from "./worker-state.enum"

export type WorkerRepresentation = {
    instance: Worker
    state: WorkerState
}