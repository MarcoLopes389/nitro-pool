export type ModuleDefinition<T> = {
  name: string;
  path: string;
  __type?: T;
};

export type ModulesMap = Record<string, any>;

export type InferModules<T extends readonly ModuleDefinition<any>[]> = {
  [K in T[number] as K['name']]: K extends ModuleDefinition<infer U>
    ? U
    : never;
};
