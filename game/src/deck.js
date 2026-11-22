// Ember Court — seeded randomness and the deck: build, shuffle, draw.
// Every shuffle comes from a mulberry32 stream seeded by the duel, so the
// same seed always deals the same hands and the screenshots reproduce.
import { CARD_LIST } from './cards.js';

/** mulberry32: a small fast seeded PRNG returning floats in [0, 1). */
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

/** A fresh 30-card deck in a seeded order (a copy of CARD_LIST, shuffled). */
export function buildDeck(seed) {
  const rng = mulberry32(seed);
  const cards = CARD_LIST.map((c) => ({ ...c }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}

/** A draw pile with a discard pile; reshuffles the discard when it runs dry. */
export class Deck {
  constructor(seed) {
    this.rng = mulberry32(seed ^ 0x9e3779b9);
    this.pile = buildDeck(seed);
    this.discard = [];
  }

  get size() {
    return this.pile.length;
  }

  /** Cards left anywhere in the deck (pile + discard), for the HUD. */
  get remaining() {
    return this.pile.length + this.discard.length;
  }

  /** Draw up to n cards, reshuffling the discard pile if the pile runs out. */
  draw(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (this.pile.length === 0) {
        if (this.discard.length === 0) break;
        this.pile = this.discard;
        this.discard = [];
        for (let k = this.pile.length - 1; k > 0; k--) {
          const j = Math.floor(this.rng() * (k + 1));
          const tmp = this.pile[k];
          this.pile[k] = this.pile[j];
          this.pile[j] = tmp;
        }
      }
      out.push(this.pile.pop());
    }
    return out;
  }

  discardCard(card) {
    this.discard.push(card);
  }
}
