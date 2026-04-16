export class Randomizer {
  static randomIndex(until: number) {
    const random = Math.random();

    const basedOnUntil = random * until;

    return Math.floor(basedOnUntil);
  }
}
