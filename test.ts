import { BulletTrain } from './src/core/bullet-train';
import { defineModule } from './src/utils/module';
import type * as FS from 'fs/promises';

const bullet = new BulletTrain({
  poolMaxMemoryMb: 128,
  maxAttempts: 2,
  retry: true,
  pools: 10,
  threads: 100,
});

async function main() {
  await Promise.all([
    bullet.run(
      async (context, modules) => {
        const array: any[] = [];
        const content = await modules.fs.readFile(
          '/home/marco/Área de Trabalho/projetos/bullet-train/test.ts',
        );
        console.log(content, Date.now());
      },
      {},
      {
        modules: [defineModule<typeof FS>('fs', 'fs/promises')],
      },
    ),
    bullet.run(
      async (context, modules) => {
        const array: any[] = [];
        const content = await modules.fs.readFile(
          '/home/marco/Área de Trabalho/projetos/bullet-train/test.ts',
        );
        console.log(content, Date.now());
      },
      {},
      {
        modules: [defineModule<typeof FS>('fs', 'fs/promises')],
      },
    ),
    bullet.run(
      async (context, modules) => {
        const array: any[] = [];
        const content = await modules.fs.readFile(
          '/home/marco/Área de Trabalho/projetos/bullet-train/test.ts',
        );
        console.log(content, Date.now());
      },
      {},
      {
        modules: [defineModule<typeof FS>('fs', 'fs/promises')],
      },
    ),
  ]);
}

main().then(() => {});
