// Ember Court — the duel state machine: rounds, ember, life, block, win/loss.
// Both duelists start at 20 Ember (life). Each round the ember pool grows —
// the round's gain is the round number itself (cap 10) — unspent ember
// carries over, and each side draws 1 card.
import { buildDeck } from './cards.js';
import { mulberry32, drawCards } from './deck.js';
import { computeIntent } from './warden.js';

const START_LIFE = 20;
const START_HAND = 5;

function newCombatant(deck) {
  return {
    // Opening ember 2, so the first hand almost always holds a playable card.
    life: START_LIFE, ember: 2, block: 0,
    hand: [], deck, discard: [],
  };
}

export function newDuel(seed) {
  const rng = mulberry32((seed >>> 0) || 1);
  const duel = {
    seed, rng,
    round: 1,
    phase: 'play', // 'play' | 'warden' | 'over'
    winner: null, // 'player' | 'warden'
    player: newCombatant(buildDeck(rng)),
    warden: newCombatant(buildDeck(rng)),
    playedSuits: { player: [], warden: [] },
    surgedSuits: { player: [], warden: [] },
    surgeNext: { player: false, warden: false },
    lastSurge: null,
    lastPlay: 'The duel begins. Play a card, then End Round.',
    wardenIntent: null,
    score: { roundsWon: 0, damageDealt: 0 },
    stats: { rounds: 1, damage: 0 },
  };
  drawCards(duel.player, START_HAND, rng);
  drawCards(duel.warden, START_HAND, rng);
  duel.wardenIntent = computeIntent(duel);
  return duel;
}

export function startRound(duel) {
  duel.round += 1;
  duel.stats.rounds = duel.round;
  for (const side of ['player', 'warden']) {
    const c = duel[side];
    c.block = 0; // block only absorbs damage during the round it was gained
    c.ember = Math.min(10, c.ember + Math.min(10, duel.round));
    drawCards(c, 1, duel.rng);
  }
  duel.playedSuits = { player: [], warden: [] };
  duel.surgedSuits = { player: [], warden: [] };
  duel.lastSurge = null;
  duel.phase = 'play';
  duel.wardenIntent = computeIntent(duel);
}

function dealDamage(duel, from, amount) {
  const foe = duel[from === 'player' ? 'warden' : 'player'];
  const absorbed = Math.min(foe.block, amount);
  foe.block -= absorbed;
  const dealt = amount - absorbed;
  foe.life = Math.max(0, foe.life - dealt);
  if (from === 'player') {
    duel.score.damageDealt += dealt;
    duel.stats.damage += dealt;
  }
  return dealt;
}

// The combo hook: the second card of a suit in one round triggers its Surge.
function triggerSurge(duel, side, suit) {
  const me = duel[side];
  let text = '';
  if (suit === 'flame') {
    dealDamage(duel, side, 3);
    text = 'FLAME SURGE +3 damage';
  } else if (suit === 'tide') {
    me.life = Math.min(START_LIFE, me.life + 3);
    text = 'TIDE SURGE heal 3';
  } else if (suit === 'thorn') {
    me.block += 4;
    dealDamage(duel, side, 2);
    text = 'THORN SURGE +4 block, reflect 2';
  } else {
    drawCards(me, 1, duel.rng);
    text = 'GALE SURGE draw 1';
  }
  duel.lastSurge = { side, suit, text };
  return duel.lastSurge;
}

function applyCard(duel, side, card, doubled, ev) {
  const me = duel[side];
  const value = doubled ? card.value * 2 : card.value;
  if (card.type === 'Strike') {
    ev.damage = dealDamage(duel, side, value);
  } else if (card.type === 'Guard') {
    me.block += value;
    ev.block = value;
  } else if (card.type === 'Kindle') {
    ev.drawn = drawCards(me, 2, duel.rng).length;
  } else if (card.type === 'Surge') {
    duel.surgeNext[side] = true;
    ev.armed = true;
  }
  duel.lastPlay = `${side === 'player' ? 'You' : 'Warden'} played ${card.name}`
    + ` (${card.type} ${card.type === 'Surge' ? 'x2' : card.value})`
    + (doubled ? ' — DOUBLED' : '');
}

function checkEnd(duel) {
  if (duel.winner) return;
  if (duel.warden.life <= 0) {
    duel.winner = 'player';
    duel.score.roundsWon += 1;
  } else if (duel.player.life <= 0) {
    duel.winner = 'warden';
  }
  if (duel.winner) duel.phase = 'over';
}

export function canPlay(duel, side, card) {
  if (duel.winner) return false;
  if (side === 'player' && duel.phase !== 'play') return false;
  if (side === 'warden' && duel.phase !== 'warden') return false;
  return card.cost <= duel[side].ember;
}

export function playCard(duel, side, cardId) {
  const me = duel[side];
  const idx = me.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return null;
  const card = me.hand[idx];
  if (!canPlay(duel, side, card)) return null;
  me.hand.splice(idx, 1);
  me.discard.push(card);
  me.ember -= card.cost;
  const doubled = duel.surgeNext[side];
  if (doubled) duel.surgeNext[side] = false;
  const ev = { card, doubled, surge: null };
  applyCard(duel, side, card, doubled, ev);
  if (!duel.surgedSuits[side].includes(card.suit)) {
    if (duel.playedSuits[side].includes(card.suit)) {
      duel.surgedSuits[side].push(card.suit);
      ev.surge = triggerSurge(duel, side, card.suit);
    } else {
      duel.playedSuits[side].push(card.suit);
    }
  }
  checkEnd(duel);
  return ev;
}

// The player ends the round: the Warden plays its telegraphed intent, then
// a new round starts (unless the duel is over).
export function endPlayerRound(duel) {
  if (duel.phase !== 'play' || duel.winner) return;
  duel.phase = 'warden';
  const intent = duel.wardenIntent || computeIntent(duel);
  for (const id of intent.cards) {
    if (duel.winner) break;
    playCard(duel, 'warden', id);
  }
  if (!duel.winner) startRound(duel);
}

export function scoreOf(duel) {
  return duel.score.roundsWon + duel.score.damageDealt;
}
