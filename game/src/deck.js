// Ember Court — seeded randomness and deck operations.
// Every shuffle and draw runs through a seeded RNG, never Math.random or the
// clock, so a staged screenshot renders the same frame on every run.
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

// A random whole number in [0, n): the one place game code needs a bounded
// draw from the seeded RNG (shuffles use it through Math.floor directly).
export function randomInt(rng, n) {
  return Math.floor(rng() * n);
}

export function shuffle(cards, rng) {
  const deck = cards.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw n cards from a combatant's deck into their hand. When the deck runs
// out, the discard pile is shuffled back in. A hand holds at most 10 cards:
// a draw into a full hand is skipped. Returns the cards drawn.
export function drawCards(combatant, n, rng) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (combatant.hand.length >= 10) break;
    if (combatant.deck.length === 0) {
      if (combatant.discard.length === 0) break;
      combatant.deck = shuffle(combatant.discard, rng);
      combatant.discard = [];
    }
    drawn.push(combatant.deck.pop());
  }
  combatant.hand.push(...drawn);
  return drawn;
}
