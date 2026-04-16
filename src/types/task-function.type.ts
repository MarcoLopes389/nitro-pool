export type TaskFunction<T, Y, M> = (context: Y, modules: M) => T;
