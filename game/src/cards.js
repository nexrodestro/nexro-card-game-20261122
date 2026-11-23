// cards.js — Ember Court card definitions: suits, types, costs, values, surge rules.
// One clear job: the data of the game. No state, no DOM, no randomness here.

export const SUITS = {
  flame: {
    key: 'flame',
    name: 'Flame',
    color: '#e2483a',
    dark: '#8f1d12',
    glow: '#ff7a4d',
    // Surge bonus when two Flame cards are played in one round.
    surgeText: 'FLAME SURGE +3 damage',
  },
  tide: {
    key: 'tide',
    name: 'Tide',
    color: '#2f7fd0',
    dark: '#123f6e',
    glow: '#6db7ff',
    surgeText: 'TIDE SURGE heal 3',
  },
  thorn: {
    key: 'thorn',
    name: 'Thorn',
    color: '#3f9e4d',
    dark: '#14532b',
    glow: '#7ed491',
    surgeText: 'THORN SURGE +4 block, reflect 2',
  },
  gale: {
    key: 'gale',
    name: 'Gale',
    color: '#d9a521',
    dark: '#7a5410',
    glow: '#ffd964',
    surgeText: 'GALE SURGE draw 1',
  },
};

// Card types. Every card has a cost (ember) and a value whose meaning
// depends on its type: Strike = damage, Guard = block, Kindle = cards drawn,
// Surge = the next card this round is doubled (value is the multiplier).
export const TYPES = {
  Strike: { label: 'STRIKE', verb: 'Deal' },
  Guard: { label: 'GUARD', verb: 'Block' },
  Kindle: { label: 'KINDLE', verb: 'Draw' },
  Surge: { label: 'SURGE', verb: 'Double next' },
};

// The full 30-card deck, in a fixed order. deck.js shuffles it with a seed;
// the order below is only the starting arrangement, never the play order.
const DECK_SPEC = [
  // Flame — damage.
  ['Ember Slash', 'flame', 'Strike', 2, 5],
  ['Cinder Fang', 'flame', 'Strike', 3, 7],
  ['Flame Lash', 'flame', 'Strike', 1, 3],
  ['Pyre Burst', 'flame', 'Strike', 4, 8],
  ['Coalbrand', 'flame', 'Strike', 2, 4],
  ['Wildspark', 'flame', 'Surge', 3, 2],
  ['Ashfall', 'flame', 'Strike', 3, 6],
  ['Bonfire', 'flame', 'Kindle', 2, 2],
  // Tide — heal and draw.
  ['Deep Draught', 'tide', 'Kindle', 1, 2],
  ['Tidewall', 'tide', 'Guard', 2, 5],
  ['Moonpool', 'tide', 'Guard', 3, 6],
  ['Undertow', 'tide', 'Strike', 2, 4],
  ['Springtide', 'tide', 'Surge', 3, 2],
  ['Stillwater', 'tide', 'Guard', 1, 3],
  ['Riptide', 'tide', 'Strike', 3, 6],
  ['Clearbrook', 'tide', 'Kindle', 2, 2],
  // Thorn — block and reflect.
  ['Briar Guard', 'thorn', 'Guard', 2, 5],
  ['Thornwall', 'thorn', 'Guard', 3, 7],
  ['Bramble Lash', 'thorn', 'Strike', 2, 4],
  ['Rootbind', 'thorn', 'Guard', 1, 3],
  ['Thicket', 'thorn', 'Surge', 2, 2],
  ['Vine Snare', 'thorn', 'Strike', 1, 3],
  ['Ironbark', 'thorn', 'Guard', 4, 8],
  // Gale — draw and tempo.
  ['Swiftwind', 'gale', 'Kindle', 1, 2],
  ['Gale Rush', 'gale', 'Strike', 2, 5],
  ['Stormcall', 'gale', 'Surge', 4, 2],
  ['Zephyr', 'gale', 'Guard', 1, 4],
  ['Tailwind', 'gale', 'Kindle', 2, 2],
  ['Skybreak', 'gale', 'Strike', 3, 7],
  ['Draft', 'gale', 'Surge', 2, 2],
];

export function buildDeckSpec() {
  return DECK_SPEC.map(([name, suit, type, cost, value], i) => ({
    id: `c${i + 1}`,
    name,
    suit,
    type,
    cost,
    value,
  }));
}

// What a surge does, in plain data, so duel.js never re-derives the rules.
export const SURGE_EFFECTS = {
  flame: { damage: 3 },
  tide: { heal: 3 },
  thorn: { block: 4, reflect: 2 },
  gale: { draw: 1 },
};

export function suitOf(card) {
  return SUITS[card.suit];
}

export function describeCard(card) {
  const t = TYPES[card.type];
  if (card.type === 'Strike') return `${t.verb} ${card.value} damage`;
  if (card.type === 'Guard') return `${t.verb} ${card.value}`;
  if (card.type === 'Kindle') return `${t.verb} ${card.value} cards`;
  return `${t.verb} the next card (x${card.value})`;
}

// How many cards of each suit a list holds — the surge check reads this.
export function countBySuit(cards) {
  const counts = { flame: 0, tide: 0, thorn: 0, gale: 0 };
  for (const c of cards) if (counts[c.suit] !== undefined) counts[c.suit]++;
  return counts;
}
