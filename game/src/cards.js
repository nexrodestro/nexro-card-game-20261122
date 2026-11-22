// Ember Court — card definitions: the four suits, the 30-card deck, surge rules.
// Suits are told apart by colour AND shape: each has its own SVG glyph path.
export const SUITS = {
  flame: {
    key: 'flame', name: 'Flame', color: '#e5484d', dark: '#8f1d22',
    glyph: 'M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-2-1-3.5-2-5-.3 1.5-1 2.5-2 3 .5-3-1-8-3-11z',
    surgeText: 'FLAME SURGE +3 damage',
  },
  tide: {
    key: 'tide', name: 'Tide', color: '#3b82f6', dark: '#1d4e9e',
    glyph: 'M12 2C12 2 5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13z',
    surgeText: 'TIDE SURGE heal 3',
  },
  thorn: {
    key: 'thorn', name: 'Thorn', color: '#3fae5a', dark: '#1e6b34',
    glyph: 'M12 2l2.5 6.5L21 9l-4.5 5L21 19l-6.5-1L12 22l-2.5-4L3 19l4.5-5L3 9l6.5-.5z',
    surgeText: 'THORN SURGE +4 block, reflect 2',
  },
  gale: {
    key: 'gale', name: 'Gale', color: '#e8a91c', dark: '#8a5f06',
    glyph: 'M12 12m-7 0a7 7 0 1 1 7 7 4.5 4.5 0 1 0-4.5-4.5A2.5 2.5 0 1 1 12 17',
    surgeText: 'GALE SURGE draw 1',
  },
};

export const SUIT_ORDER = ['flame', 'tide', 'thorn', 'gale'];

// The combo hook: two cards of the SAME suit in one round trigger that suit's Surge.
export const SURGE_RULES = {
  flame: 'Play two Flame cards in one round: +3 damage to the Warden.',
  tide: 'Play two Tide cards in one round: heal 3 Ember.',
  thorn: 'Play two Thorn cards in one round: +4 block and reflect 2 damage.',
  gale: 'Play two Gale cards in one round: draw 1 extra card.',
};

// [suit, type, value, cost, name] — 30 original cards, values 2-8, costs 1-5.
const DECK_SPEC = [
  ['flame', 'Strike', 2, 1, 'Cinder Spark'],
  ['flame', 'Strike', 3, 2, 'Ember Lash'],
  ['flame', 'Strike', 5, 3, 'Flame Tongue'],
  ['flame', 'Strike', 6, 4, 'Pyre Claw'],
  ['flame', 'Strike', 8, 5, 'Inferno Roar'],
  ['flame', 'Guard', 4, 2, 'Ash Wall'],
  ['flame', 'Kindle', 2, 2, 'Fan the Flames'],
  ['flame', 'Surge', 2, 3, 'Wildfire'],
  ['tide', 'Strike', 2, 1, 'Dew Prick'],
  ['tide', 'Strike', 4, 3, 'Tide Cut'],
  ['tide', 'Strike', 6, 4, 'Riptide'],
  ['tide', 'Guard', 4, 2, 'Still Water'],
  ['tide', 'Guard', 6, 3, 'Deep Pool'],
  ['tide', 'Kindle', 2, 2, 'Spring Draw'],
  ['tide', 'Surge', 2, 3, 'Floodgate'],
  ['thorn', 'Strike', 2, 1, 'Thorn Prick'],
  ['thorn', 'Strike', 3, 2, 'Briar Lash'],
  ['thorn', 'Strike', 4, 3, 'Vine Snare'],
  ['thorn', 'Strike', 6, 4, 'Thorn Maw'],
  ['thorn', 'Guard', 4, 2, 'Bark Skin'],
  ['thorn', 'Guard', 8, 4, 'Ironwood'],
  ['thorn', 'Kindle', 2, 2, 'Root Deep'],
  ['thorn', 'Surge', 2, 3, 'Overgrowth'],
  ['gale', 'Strike', 2, 1, 'Zephyr Nip'],
  ['gale', 'Strike', 3, 2, 'Gust Slash'],
  ['gale', 'Strike', 5, 3, 'Cyclone Edge'],
  ['gale', 'Strike', 7, 4, 'Storm Beak'],
  ['gale', 'Guard', 5, 3, 'Wind Wall'],
  ['gale', 'Kindle', 2, 2, 'Catch the Wind'],
  ['gale', 'Surge', 2, 3, 'Tailwind'],
];

export function buildDeck(rng) {
  if (DECK_SPEC.length !== 30) throw new Error(`Ember Court deck must hold 30 cards, found ${DECK_SPEC.length}`);
  const cards = DECK_SPEC.map(([suit, type, value, cost, name], i) => ({
    id: `c${i + 1}`, suit, type, value, cost, name,
  }));
  // Seeded Fisher-Yates shuffle, so the same seed deals the same deck.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function suitOf(card) {
  return SUITS[card.suit];
}

export function surgeTextFor(suit) {
  return SUITS[suit].surgeText;
}
