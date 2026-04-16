import { ModuleDefinition } from '../types/module.type';

export function defineModule<T>(
  name: string,
  path?: string,
): ModuleDefinition<T> {
  return {
    name,
    path: path ?? name,
  };
}
