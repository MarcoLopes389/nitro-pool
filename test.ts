import { BulletTrain } from "./src/core/bullet-train";

const bullet = new BulletTrain({
  poolMaxMemory: 128,
  maxAttempts: 2,
  retry: true,
  pools: 2,
  threads: 5
})

bullet.run(async (context, modules) => {
    const array: any[] = []
    const content = await modules.fs.readFile('/home/marco/Área de Trabalho/projetos/bullet-train/test.ts')
    console.log(content)
}, {}, {
  modules: {
    fs: 'fs/promises'
  }
})