import { createContext, runInContext } from 'vm';
import { ModulesMap } from '../types/module.type';

export class TaskExecutor {
  private moduleCache = new Map();
  private loadedModules: Record<string, any> = {};

  async execute(func: string, context: unknown): Promise<unknown> {
    const contextfied = createContext({
      context,
      console,
      modules: this.loadedModules,
    });

    const script = `
            (async () => {
              const fn = ${func}
              return await fn({context, modules})
            })()
        `;

    const result = await runInContext(script, contextfied);

    return result;
  }

  loadModules(modules: ModulesMap): void {
    const loadedModules: Record<string, any> = {};

    for (const [alias, moduleName] of Object.entries(modules)) {
      loadedModules[alias] = this.loadModule(moduleName);
    }

    this.loadedModules = loadedModules;
  }

  private loadModule(name: string) {
    if (!this.moduleCache.has(name)) {
      this.moduleCache.set(name, require(name));
    }
    return this.moduleCache.get(name);
  }
}
