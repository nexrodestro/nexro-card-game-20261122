// Ember Court — card definitions: the four suits, the four card types,
// every card in the 30-card deck, and the same-suit Surge rules.
// A card is { id, name, suit, type, value, cost }.
//   Strike: deal `value` damage. Guard: gain `value` block.
//   Kindle: draw `value` cards. Surge: the next card you play this round
//   has its effect doubled. Costs are paid from the ember pool.
export const SUITS = {
  flame: { name: 'Flame', color: '#e5482f', dark: '#7d1a0c', light: '#ffb199', glyph: 'flame', surge: 'FLAME SURGE  +3 damage' },
  tide: { name: 'Tide', color: '#2f7fe0', dark: '#123f7d', light: '#a8ccff', glyph: 'droplet', surge: 'TIDE SURGE  heal 3' },
  thorn: { name: 'Thorn', color: '#3fae5a', dark: '#14532a', light: '#a9e8bd', glyph: 'thorn', surge: 'THORN SURGE  +4 block, reflect 2' },
  gale: { name: 'Gale', color: '#d9a521', dark: '#6e5205', light: '#ffe9a8', glyph: 'swirl', surge: 'GALE SURGE  draw 1' },
};

export const SUIT_ORDER = ['flame', 'tide', 'thorn', 'gale'];

export const TYPES = {
  strike: { name: 'Strike', verb: 'Deal' },
  guard: { name: 'Guard', verb: 'Block' },
  kindle: { name: 'Kindle', verb: 'Draw' },
  surge: { name: 'Surge', verb: 'Double' },
};

/** The 30-card Ember Court deck. Values 2-8, costs 1-5. */
export const CARD_LIST = [
  { id: 'f1', name: 'Ember Lash', suit: 'flame', type: 'strike', value: 6, cost: 3 },
  { id: 'f2', name: 'Pyre Burst', suit: 'flame', type: 'strike', value: 8, cost: 5 },
  { id: 'f3', name: 'Spark Jab', suit: 'flame', type: 'strike', value: 4, cost: 2 },
  { id: 'f4', name: 'Cinder Arc', suit: 'flame', type: 'strike', value: 5, cost: 3 },
  { id: 'f5', name: 'Ash Wall', suit: 'flame', type: 'guard', value: 4, cost: 2 },
  { id: 'f6', name: 'Fan Flames', suit: 'flame', type: 'kindle', value: 2, cost: 1 },
  { id: 'f7', name: 'Wildfire', suit: 'flame', type: 'surge', value: 2, cost: 2 },
  { id: 'f8', name: 'Coal Bite', suit: 'flame', type: 'strike', value: 3, cost: 1 },
  { id: 't1', name: 'Tide Mend', suit: 'tide', type: 'guard', value: 6, cost: 3 },
  { id: 't2', name: 'Deep Pull', suit: 'tide', type: 'kindle', value: 2, cost: 1 },
  { id: 't3', name: 'Wave Crash', suit: 'tide', type: 'strike', value: 5, cost: 3 },
  { id: 't4', name: 'Still Pool', suit: 'tide', type: 'guard', value: 3, cost: 1 },
  { id: 't5', name: 'Riptide', suit: 'tide', type: 'strike', value: 7, cost: 4 },
  { id: 't6', name: 'Floodgate', suit: 'tide', type: 'surge', value: 2, cost: 2 },
  { id: 't7', name: 'Rain Call', suit: 'tide', type: 'kindle', value: 2, cost: 2 },
  { id: 't8', name: 'Salt Spray', suit: 'tide', type: 'strike', value: 3, cost: 2 },
  { id: 'h1', name: 'Thorn Wall', suit: 'thorn', type: 'guard', value: 5, cost: 2 },
  { id: 'h2', name: 'Briar Snare', suit: 'thorn', type: 'strike', value: 4, cost: 2 },
  { id: 'h3', name: 'Root Hold', suit: 'thorn', type: 'guard', value: 7, cost: 4 },
  { id: 'h4', name: 'Seed Burst', suit: 'thorn', type: 'kindle', value: 2, cost: 1 },
  { id: 'h5', name: 'Vine Lash', suit: 'thorn', type: 'strike', value: 6, cost: 4 },
  { id: 'h6', name: 'Bloom', suit: 'thorn', type: 'surge', value: 2, cost: 2 },
  { id: 'h7', name: 'Petal Guard', suit: 'thorn', type: 'guard', value: 3, cost: 1 },
  { id: 'g1', name: 'Gale Rush', suit: 'gale', type: 'strike', value: 4, cost: 2 },
  { id: 'g2', name: 'Tailwind', suit: 'gale', type: 'kindle', value: 2, cost: 1 },
  { id: 'g3', name: 'Storm Eye', suit: 'gale', type: 'strike', value: 7, cost: 4 },
  { id: 'g4', name: 'Feather Guard', suit: 'gale', type: 'guard', value: 4, cost: 2 },
  { id: 'g5', name: 'Whirl', suit: 'gale', type: 'surge', value: 2, cost: 2 },
  { id: 'g6', name: 'Crosswind', suit: 'gale', type: 'strike', value: 3, cost: 1 },
  { id: 'g7', name: 'Sky Draft', suit: 'gale', type: 'kindle', value: 2, cost: 2 },
  { id: 'g8', name: 'Dust Veil', suit: 'gale', type: 'guard', value: 6, cost: 3 },
];

/** Look a card up by id (used by the staging autopilot and tests). */
export function cardById(id) {
  return CARD_LIST.find((c) => c.id === id) ?? null;
}

/** One-line effect text for a card, shown under its value. */
export function effectText(card) {
  if (card.type === 'strike') return `Deal ${card.value} damage`;
  if (card.type === 'guard') return `Gain ${card.value} block`;
  if (card.type === 'kindle') return `Draw ${card.value} cards`;
  return 'Double your next card';
}

/** The suit-surge line announced when a suit is played twice in a round. */
export function surgeLine(suit) {
  return SUITS[suit].surge;
}
