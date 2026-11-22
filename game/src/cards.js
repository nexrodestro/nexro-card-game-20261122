// Ember Court — card definitions: the four suits, the four card types,
// the thirty-card deck, and the same-suit Surge rules.
// Suits are told apart by colour AND shape, never by text alone:
//   Flame  red   — flame glyph — damage
//   Tide   blue  — droplet     — heal and draw
//   Thorn  green — thorn glyph — block and reflect
//   Gale   gold  — swirl       — draw and tempo

export const SUITS = {
  flame: { key: 'flame', name: 'Flame', color: '#d92b1f', dark: '#8f130b', light: '#ffd9d2', glyph: 'flame', surge: 'FLAME SURGE +3 damage' },
  tide: { key: 'tide', name: 'Tide', color: '#2273d6', dark: '#0f4a94', light: '#d2e6ff', glyph: 'droplet', surge: 'TIDE SURGE heal 3' },
  thorn: { key: 'thorn', name: 'Thorn', color: '#2c8a3e', dark: '#145c22', light: '#d3f2d6', glyph: 'thorn', surge: 'THORN SURGE +4 block, reflect 2' },
  gale: { key: 'gale', name: 'Gale', color: '#c08a00', dark: '#7a5800', light: '#ffedb8', glyph: 'swirl', surge: 'GALE SURGE draw 1 extra' },
};

export const SUIT_KEYS = ['flame', 'tide', 'thorn', 'gale'];

// Card types. Every card has a cost (ember) and a value.
//   Strike — deal `value` damage.
//   Guard  — gain `value` block, absorbing damage this round.
//   Kindle — draw `value` cards.
//   Surge  — double the next card you play this round. Its shown value is
//            the multiplier (x2), not damage, so the numeral never lies.
export const CARD_TYPES = ['Strike', 'Guard', 'Kindle', 'Surge'];

// The thirty-card deck: name, suit, type, cost, value.
// Values run 2–8, costs 1–5, so a ten-year-old can read the table.
const DECK_DEFS = [
  // Flame — damage.
  ['Ember Lash', 'flame', 'Strike', 3, 6],
  ['Coal Bite', 'flame', 'Strike', 1, 3],
  ['Pyre Burst', 'flame', 'Strike', 5, 8],
  ['Cinder Jab', 'flame', 'Strike', 2, 4],
  ['Flame Fan', 'flame', 'Strike', 3, 5],
  ['Ash Whip', 'flame', 'Strike', 1, 2],
  ['Wildfire', 'flame', 'Strike', 4, 7],
  ['Ember Surge', 'flame', 'Surge', 2, 2],
  // Tide — heal and draw.
  ['Salt Spray', 'tide', 'Strike', 2, 3],
  ['Deep Pull', 'tide', 'Kindle', 1, 2],
  ['Tide Mend', 'tide', 'Guard', 3, 6],
  ['Still Water', 'tide', 'Guard', 2, 4],
  ['Undertow', 'tide', 'Strike', 3, 5],
  ['Rain Call', 'tide', 'Kindle', 2, 2],
  ['Flood Gate', 'tide', 'Strike', 4, 6],
  ['Tide Surge', 'tide', 'Surge', 2, 2],
  // Thorn — block and reflect.
  ['Seed Burst', 'thorn', 'Kindle', 1, 2],
  ['Briar Snare', 'thorn', 'Strike', 2, 4],
  ['Thorn Wall', 'thorn', 'Guard', 2, 5],
  ['Feather Guard', 'thorn', 'Guard', 1, 4],
  ['Bramble', 'thorn', 'Strike', 1, 3],
  ['Root Hold', 'thorn', 'Guard', 4, 7],
  ['Vine Lash', 'thorn', 'Strike', 3, 5],
  // Gale — draw and tempo.
  ['Gale Rush', 'gale', 'Strike', 2, 4],
  ['Swift Cut', 'gale', 'Strike', 1, 3],
  ['Wind Step', 'gale', 'Kindle', 2, 2],
  ['Storm Eye', 'gale', 'Strike', 3, 6],
  ['Zephyr Guard', 'gale', 'Guard', 3, 5],
  ['Sky Break', 'gale', 'Strike', 4, 7],
  ['Tailwind', 'gale', 'Kindle', 1, 2],
  ['Cyclone', 'gale', 'Strike', 2, 5],
];

/** Build a fresh thirty-card deck. Each card gets a stable id. */
export function buildDeckCards() {
  return DECK_DEFS.map(([name, suit, type, cost, value], i) => ({
    id: `card-${i + 1}`,
    name,
    suit,
    type,
    cost,
    value,
  }));
}

/** One-line effect text shown under a card's name. */
export function cardEffectText(card) {
  if (card.type === 'Strike') return `Deal ${card.value} damage`;
  if (card.type === 'Guard') return `Gain ${card.value} block`;
  if (card.type === 'Kindle') return `Draw ${card.value} cards`;
  return `Double your next card`;
}

/** The suit's Surge bonus, applied when two cards of the same suit land in one round. */
export function surgeBonus(suitKey) {
  if (suitKey === 'flame') return { damage: 3, heal: 0, block: 0, reflect: 0, draw: 0 };
  if (suitKey === 'tide') return { damage: 0, heal: 3, block: 0, reflect: 0, draw: 0 };
  if (suitKey === 'thorn') return { damage: 0, heal: 0, block: 4, reflect: 2, draw: 0 };
  return { damage: 0, heal: 0, block: 0, reflect: 0, draw: 1 };
}
