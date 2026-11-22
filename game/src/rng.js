// rng.js — seeded random numbers for EMBER DUEL.
// mulberry32: small, fast, deterministic. One seed drives every shuffle and
// draw, so a ?seed= URL reproduces the exact same game.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by a seeded rng function.
export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Pick a random integer in [min, max] from a seeded rng.
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
