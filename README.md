# Nitro

- [Installation](#installation)
- [Goal](#goal)
- [Basic Usage](#basic-usage)
- [How it works](#how-it-works)
- [When to use](#when-to-use)
- [Best Practices](#best-practices)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Modules](#modules)
- [Observability](#observability)
- [Autoscaling](#autoscaling)
- [Limitations](#limitations)
- [Security](#security)

## Installation

```bash
npm install nitro-pool
```

## Goal

Node.js does not provide a simple way to execute dynamic tasks in isolated threads or processes.

When working with `child_process` or `worker_threads`, developers are usually required to create separate `.js` files and manually manage their execution. This adds friction, reduces developer experience, and often leads teams to avoid proper parallelism — even for CPU-bound or blocking tasks.

Nitro was created to solve this problem.

It provides a simple and powerful abstraction over both `child_process` and `worker_threads`, allowing you to:

- Create multiple process pools
- Configure the number of threads per pool
- Execute tasks in parallel without managing worker files
- Run tasks using simple inline functions

Instead of dealing with low-level APIs, you can just write:

```js
await nitro.run(
  async ({ modules }) => {
    const content = await modules.fs.readFile('file.txt', 'utf-8');
    return content.toUpperCase();
  },
  {},
  {
    modules: [defineModule('fs', 'fs/promises')],
  },
);
```

Nitro handles the rest — process isolation, worker management, and execution.

## Basic Usage

The Nitro class uses an internal Promise-based system that waits for task execution across threads and resolves or rejects based on the final result of your code.

An important detail about the function you provide to the `run` method is that, due to JavaScript limitations, it is completely isolated from the outer scope. This means you must explicitly inject any variables (via `context`) and modules you want to use inside the function.

Additionally, it is not possible to use externally declared functions — everything must be defined within the function itself.

Below is a basic usage example:

```javascript
const nitro = new Nitro({
  poolMaxMemoryMb: 128, // memory limit per pool
  pools: 10, // number of pools
  threads: 2, // threads per pool (total: 20)
});

await nitro.run(
  async ({ context, modules }) => {
    const content = await modules.fs.readFile(context.path);
    return content;
  },
  {
    path: 'test.txt',
  },
  {
    modules: [defineModule('fs', 'fs/promises')],
  },
);
```

When executing this operation, the library automatically loads the specified module and injects it into the execution context.

All parameters passed through context and modules are fully typed, making development easier and safer.

If you try to execute more tasks than available threads, the library will automatically queue the extra tasks. Each thread processes one task at a time and continuously pulls new tasks from the queue.

```javascript
const nitro = new Nitro({
  poolMaxMemoryMb: 128,
  pools: 2,
  threads: 1,
});

// Since there are only 2 threads available, one of these tasks will be queued
await Promise.all([
  nitro.run(
    async ({ context, modules }) => {
      const content = await modules.fs.readFile(context.path);
      return content;
    },
    {
      path: 'test.txt',
    },
    {
      modules: [defineModule('fs', 'fs/promises')],
    },
  ),
  nitro.run(
    async ({ context, modules }) => {
      const content = await modules.fs.readFile(context.path);
      return content;
    },
    {
      path: 'test.txt',
    },
    {
      modules: [defineModule('fs', 'fs/promises')],
    },
  ),
  nitro.run(
    async ({ context, modules }) => {
      const content = await modules.fs.readFile(context.path);
      return content;
    },
    {
      path: 'test.txt',
    },
    {
      modules: [defineModule('fs', 'fs/promises')],
    },
  ),
]);
```

## How it works

Nitro uses a combination of `child_process` and `worker_threads` to execute tasks in parallel.

- Each pool is a separate process
- Each process manages multiple worker threads
- Tasks are distributed across workers
- A queue system ensures tasks are executed when threads become available

This design provides both isolation (process-level) and performance (thread-level).

## When to use

Nitro is designed for:

- CPU-intensive tasks
- Blocking operations
- Parallel data processing

It is not recommended for:

- Simple I/O operations already handled efficiently by Node.js
- Lightweight async flows

## Best Practices

- Keep tasks small and focused
- Avoid heavy serialization in `context`
- Reuse pools instead of creating new instances frequently
- Prefer async functions for I/O operations

## Configuration

| Option                    | Type   | Required | Description                                                                 |
|---------------------------|--------|----------|-----------------------------------------------------------------------------|
| `pools`                   | number | yes      | Number of process pools to create                                           |
| `threads`                 | number | yes      | Initial number of worker threads per pool                                   |
| `poolMaxMemoryMb`         | number | no       | Maximum memory (in MB) allowed per pool process                             |
| `logging`                 | boolean| no       | Enables internal logging                                                    |
| `maxPoolQueueSize`        | number | no       | Maximum number of tasks allowed in the pool queue                           |
| `autoscaling`             | boolean| no       | Enables automatic scaling of worker threads                                 |
| `scalingInterval`         | number | no       | Interval (in ms) between autoscaling evaluations                            |
| `minThreads`              | number | no       | Minimum number of threads when autoscaling is enabled                       |
| `maxThreads`              | number | no       | Maximum number of threads when autoscaling is enabled                       |
| `targetUtilization`       | number | no       | Desired worker utilization ratio (e.g. 0.7 = 70% busy)                      |
| `scaleUpQueueThreshold`   | number | no       | Queue size threshold to trigger scaling up                                  |
| `scaleDownQueueThreshold` | number | no       | Queue size threshold to trigger scaling down                                |
| `maxStep`                 | number | no       | Maximum number of threads to add/remove per scaling cycle                   |

### Defaults

When optional options are not provided, Nitro uses sensible defaults:

- `logging`: false  
- `autoscaling`: false  
- `scalingInterval`: 1000ms  
- `targetUtilization`: 0.7  
- `maxStep`: 1  

Autoscaling-related options are only considered when `autoscaling` is enabled.

## Error Handling

If a task throws an error or rejects, the `run` method will reject the Promise with the corresponding error.

```ts
try {
  await bullet.run(...)
} catch (err) {
  console.error(err)
}
```

## Modules

Since tasks run in an isolated environment, external modules must be explicitly injected.

```ts
modules: [defineModule('fs', 'fs/promises')];
```

Inside the task:

```ts
modules.fs.readFile(...)
```

### Why this is required

Tasks are executed in a sandboxed environment and do not have access to Node.js globals like require.

Explicit module injection ensures:

- Predictable execution
- Better type safety
- No hidden dependencies

## Observability

Nitro provides internal metrics that can be used to monitor system performance.

Metrics include:

- Active workers
- Idle workers
- Queue size
- Average execution time
- Average tasks per second

These metrics are used internally for autoscaling and can be exposed for monitoring purposes.

## Autoscaling

Nitro includes an optional autoscaling system that dynamically adjusts the number of workers based on workload.

It evaluates:

- Task throughput
- Average execution time
- Queue size

Based on these metrics, Nitro automatically scales the number of workers up or down to maintain optimal performance.

### Example

```ts
const nitro = new Nitro({
  pools: 2,
  threads: 2,
  autoScale: true,
});
```

Autoscaling helps maintain a stable queue size and prevents both underutilization and overload.

## Limitations

Due to the execution model used by Nitro, there are some important limitations:

- Functions passed to `run` are fully isolated from the outer scope
- Functions are serialized using `toString()`
- External variables are not accessible unless passed via `context`
- External functions cannot be referenced
- Closures are not supported
- Only serializable data can be passed as `context`
- Dynamic imports inside the task are not supported (use `modules` instead)

Make sure all required logic is defined inside the function body.

## Security

Tasks are executed using `vm` in an isolated context.

This library assumes that the code being executed is trusted. It is not designed to safely execute untrusted user input.
