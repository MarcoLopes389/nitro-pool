export type TaskFunction<T, Y, M> = (ref: {context: Y; modules: M}) => T;
