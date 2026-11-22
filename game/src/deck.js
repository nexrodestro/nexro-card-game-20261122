// Ember Court — deck and seeded randomness.
// One seeded RNG drives every shuffle and every staged screenshot, so the
// same seed always deals the same hands and the same frame.

/** Mulberry32: a tiny deterministic PRNG. `seed` is any integer. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A draw pile with a discard pile; reshuffles the discard when it runs dry. */
export class Deck {
  constructor(cards, rng) {
    this.rng = rng;
    this.pile = cards.slice();
    this.discard = [];
    this.shuffle();
  }

  shuffle() {
    const pile = this.pile;
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]];
    }
  }

  /** Draw up to `count` cards; returns fewer only when both piles are empty. */
  draw(count) {
    const drawn = [];
    for (let n = 0; n < count; n++) {
      if (this.pile.length === 0) {
        if (this.discard.length === 0) break;
        this.pile = this.discard;
        this.discard = [];
        this.shuffle();
      }
      drawn.push(this.pile.pop());
    }
    return drawn;
  }

  discardCards(cards) {
    this.discard.push(...cards);
  }

  get size() {
    return this.pile.length;
  }
}
