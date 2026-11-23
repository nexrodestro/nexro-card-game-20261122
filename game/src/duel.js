// duel.js — the duel state machine: rounds, ember, life, block, win/loss.
// One clear job: the rules. It knows nothing about the DOM; render.js reads
// this state and input.js calls these functions.

import { buildDeckSpec, SURGE_EFFECTS, SUITS } from './cards.js';
import { buildDeck, drawCards, discardCard, makeRng } from './deck.js';

export const START_LIFE = 20;
export const START_EMBER = 2;
export const MAX_EMBER = 10;
export const MAX_LIFE = 20;
export const HAND_SIZE = 5;

function freshSide(deck) {
  return {
    life: START_LIFE,
    ember: START_EMBER,
    block: 0,
    reflect: 0,
    deck,
    discard: [],
    hand: [],
    // Cards played this round, in order — the centre row shows the last two.
    playedThisRound: [],
    playedSuits: [],
    // A Surge card arms this; the next card played this round is doubled.
    doubleNext: false,
    damageDealt: 0,
    damageTaken: 0,
  };
}

export function newDuel(seed = 1) {
  const rng = makeRng(seed * 7919 + 13);
  const duel = {
    seed,
    rng,
    round: 1,
    phase: 'title', // title | play | warden | over
    winner: null, // 'player' | 'warden' | null
    player: freshSide(buildDeck(buildDeckSpec(), seed)),
    warden: freshSide(buildDeck(buildDeckSpec(), seed + 101)),
    // Last surge that fired, for the callout: { suit, text, by } | null.
    lastSurge: null,
    // Which suit surges already fired this round, per side.
    surgeFired: { player: {}, warden: {} },
    // Last play, for the centre row and the round log.
    lastPlays: [],
    log: [],
    score: 0,
    roundsWon: 0,
    // Damage dealt this round, per side — decides who "won" the round.
    roundDamage: { player: 0, warden: 0 },
    // The warden's telegraphed intent for this round.
    intent: null,
    turn: 0,
  };
  drawCards(duel.player.deck, duel.player.discard, duel.player.hand, HAND_SIZE, rng);
  drawCards(duel.warden.deck, duel.warden.discard, duel.warden.hand, HAND_SIZE, rng);
  // Top-level mirror of the per-side suit lists (same arrays, not copies),
  // so callers can read duel.playedSuits.player / .warden directly.
  duel.playedSuits = { player: duel.player.playedSuits, warden: duel.warden.playedSuits };
  return duel;
}

export function startDuel(duel) {
  duel.phase = 'play';
  duel.turn = 1;
  return duel;
}

export function isOver(duel) {
  return duel.phase === 'over';
}

// Damage that actually lands after block; reflect fires back at the attacker.
export function dealDamage(duel, from, to, amount) {
  const attacker = duel[from];
  const defender = duel[to];
  if (amount <= 0 || duel.phase === 'over') return 0;
  let left = amount;
  if (defender.block > 0) {
    const absorbed = Math.min(defender.block, left);
    defender.block -= absorbed;
    left -= absorbed;
  }
  if (left > 0) {
    defender.life = Math.max(0, defender.life - left);
    defender.damageTaken += left;
    attacker.damageDealt += left;
    duel.roundDamage[from] += left;
    // Reflect: the defender's stored thorns bite back, then are spent.
    if (defender.reflect > 0) {
      const back = defender.reflect;
      defender.reflect = 0;
      attacker.life = Math.max(0, attacker.life - back);
      attacker.damageTaken += back;
      defender.damageDealt += back;
      duel.roundDamage[to] += back;
      duel.log.push(`Reflect ${back} hits the ${from === 'player' ? 'challenger' : 'Warden'}.`);
    }
  }
  checkEnd(duel);
  return left;
}

export function heal(duel, side, amount) {
  const s = duel[side];
  s.life = Math.min(MAX_LIFE, s.life + amount);
}

export function gainBlock(duel, side, amount) {
  duel[side].block += amount;
}

function fireSurge(duel, side, suit) {
  const fx = SURGE_EFFECTS[suit];
  const other = side === 'player' ? 'warden' : 'player';
  duel.lastSurge = { suit, text: SUITS[suit].surgeText, by: side };
  duel.log.push(`${SUITS[suit].surgeText} (${side === 'player' ? 'you' : 'Warden'}).`);
  if (fx.damage) dealDamage(duel, side, other, fx.damage);
  if (fx.heal) heal(duel, side, fx.heal);
  if (fx.block) gainBlock(duel, side, fx.block);
  if (fx.reflect) duel[side].reflect += fx.reflect;
  if (fx.draw) drawCards(duel[side].deck, duel[side].discard, duel[side].hand, fx.draw, duel.rng);
}

// Play one card from a side's hand. Returns the played card, or null when
// the play is illegal (not in hand, or not enough ember).
export function playCard(duel, side, cardId) {
  const me = duel[side];
  const other = side === 'player' ? 'warden' : 'player';
  const card = me.hand.find((c) => c.id === cardId);
  if (!card || card.cost > me.ember) return null;
  me.ember -= card.cost;
  discardCard(me.hand, me.discard, cardId);
  me.playedThisRound.push(card);
  me.playedSuits.push(card.suit);
  duel.lastPlays.push({ side, card });
  if (duel.lastPlays.length > 4) duel.lastPlays.shift();

  let value = card.value;
  if (me.doubleNext && card.type !== 'Surge') {
    value = card.value * 2;
    me.doubleNext = false;
    duel.log.push(`${card.name} doubled to ${value}.`);
  }
  if (card.type === 'Surge') {
    me.doubleNext = true;
    duel.log.push(`${side === 'player' ? 'You play' : 'Warden plays'} ${card.name} — next card doubled.`);
  } else if (card.type === 'Strike') {
    dealDamage(duel, side, other, value);
    duel.log.push(`${side === 'player' ? 'You strike' : 'Warden strikes'} ${value} with ${card.name}.`);
  } else if (card.type === 'Guard') {
    gainBlock(duel, side, value);
    duel.log.push(`${side === 'player' ? 'You guard' : 'Warden guards'} ${value} with ${card.name}.`);
  } else if (card.type === 'Kindle') {
    drawCards(me.deck, me.discard, me.hand, value, duel.rng);
    duel.log.push(`${side === 'player' ? 'You kindle' : 'Warden kindles'} ${card.name}, draw ${value}.`);
  }

  // Two cards of the same suit in one round fire that suit's surge, once
  // per suit per side per round.
  const count = me.playedSuits.filter((s) => s === card.suit).length;
  if (count >= 2 && !duel.surgeFired[side][card.suit]) {
    duel.surgeFired[side][card.suit] = true;
    fireSurge(duel, side, card.suit);
  }
  checkEnd(duel);
  return card;
}

function checkEnd(duel) {
  if (duel.phase === 'over') return;
  if (duel.warden.life <= 0) {
    duel.phase = 'over';
    duel.winner = 'player';
  } else if (duel.player.life <= 0) {
    duel.phase = 'over';
    duel.winner = 'warden';
  }
}

function scoreRound(duel) {
  if (duel.roundDamage.player > duel.roundDamage.warden) duel.roundsWon++;
  duel.score = duel.player.damageDealt + duel.roundsWon;
  duel.roundDamage = { player: 0, warden: 0 };
}

// End the player's turn: the warden acts, then the next round begins.
export function endRound(duel, wardenAct) {
  if (duel.phase !== 'play') return false;
  duel.phase = 'warden';
  if (typeof wardenAct === 'function') wardenAct(duel);
  if (duel.phase === 'over') return true;
  scoreRound(duel);
  duel.round++;
  duel.phase = 'play';
  duel.turn++;
  for (const side of [duel.player, duel.warden]) {
    side.block = 0;
    // Clear in place: duel.playedSuits mirrors these exact arrays.
    side.playedThisRound.length = 0;
    side.playedSuits.length = 0;
    side.doubleNext = false;
    // Ember grows by the round number, capped at 10; unspent ember carries.
    side.ember = Math.min(MAX_EMBER, side.ember + Math.min(duel.round, MAX_EMBER));
    drawCards(side.deck, side.discard, side.hand, 1, duel.rng);
  }
  duel.surgeFired = { player: {}, warden: {} };
  duel.lastSurge = null;
  if (duel.log.length > 40) duel.log.splice(0, duel.log.length - 40);
  duel.log.push(`Round ${duel.round} begins.`);
  return true;
}
