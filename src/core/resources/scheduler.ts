import { TaskPriority } from '../../enums/task-priority.enum';
import { WorkerMessage } from '../../protocol/worker-message.type';

export class Scheduler {
  private queues: Record<TaskPriority, WorkerMessage[]> = {
    [TaskPriority.HIGH]: [],
    [TaskPriority.NORMAL]: [],
    [TaskPriority.LOW]: [],
  };

  private highBurst = 0;
  private readonly MAX_HIGH_BURST = 5;

  enqueue(task: WorkerMessage, priority: TaskPriority = TaskPriority.NORMAL) {
    this.queues[priority].push(task);
  }

  dequeue(): WorkerMessage | null {
    if (
      this.queues[TaskPriority.HIGH].length > 0 &&
      this.highBurst < this.MAX_HIGH_BURST
    ) {
      this.highBurst++;
      return this.queues[TaskPriority.HIGH].shift()!;
    }

    if (this.queues[TaskPriority.NORMAL].length > 0) {
      this.highBurst = 0;
      return this.queues[TaskPriority.NORMAL].shift()!;
    }

    if (this.queues[TaskPriority.LOW].length > 0) {
      this.highBurst = 0;
      return this.queues[TaskPriority.LOW].shift()!;
    }

    if (this.queues[TaskPriority.HIGH].length > 0) {
      this.highBurst = 0;
      return this.queues[TaskPriority.HIGH].shift()!;
    }

    return null;
  }

  size() {
    return Object.values(this.queues).reduce((acc, q) => acc + q.length, 0);
  }
}
