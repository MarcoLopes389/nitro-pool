import { BulletTrain } from "./src/core/bullet-train.js";

const bullet = new BulletTrain({
  pools: 2,
  threads: 2
})

async function main() {
  const param1 = 2
  const param2 = 3
  const param3 = 4
  const param4 = 5

  const [result1, result2] = await Promise.all([
    bullet.run((context) => {
      return context.param1 + context.param2
    }, { param1, param2 }),
    bullet.run((context) => {
      return context.param3 + context.param4
    }, { param3, param4 })
  ])

  console.log(result1 == 5, result2 == 9)
  console.log(result1, result2)
}

main().then(() => {})