// deck.js — deck build, seeded shuffle, draw and discard.
// One clear job: the pile of cards. The duel never touches the array directly.

// mulberry32: small, fast, deterministic. Same seed → same shuffle, always.
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

export function shuffleInPlace(cards, rng) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}

// Build a fresh 30-card deck and shuffle it with the given seed.
export function buildDeck(spec, seed) {
  const cards = spec.map((c) => ({ ...c }));
  return shuffleInPlace(cards, makeRng(seed));
}

// Draw n cards from the deck into a hand. When the deck runs out, the
// discard pile is shuffled back in (same rng, so the sequence stays seeded).
// A hand never grows past 10 cards; excess draws are skipped, never lost.
export function drawCards(deck, discard, hand, n, rng) {
  let drawn = 0;
  for (let k = 0; k < n; k++) {
    if (hand.length >= 10) break;
    if (deck.length === 0) {
      if (discard.length === 0) break;
      while (discard.length > 0) deck.push(discard.pop());
      shuffleInPlace(deck, rng);
    }
    hand.push(deck.pop());
    drawn++;
  }
  return drawn;
}

export function discardCard(hand, discard, cardId) {
  const i = hand.findIndex((c) => c.id === cardId);
  if (i < 0) return null;
  const [card] = hand.splice(i, 1);
  discard.push(card);
  return card;
}
