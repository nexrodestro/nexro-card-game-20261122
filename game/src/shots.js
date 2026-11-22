// Ember Court — deterministic screenshot staging.
// `?shot=title|table|win|loss&seed=1` rebuilds one exact frame from the
// seeded RNG and a simple autopilot that plays by the real rules. The
// same seed always stages the same frame, so the screenshots main.ts
// copies are reproducible byte for byte.

import { buildDeckCards } from './cards.js';
import { Duel } from './duel.js';
import { playWardenTurn, wardenIntent } from './warden.js';

/** Pick the highest-value affordable strike, else the best affordable card. */
function pickAggressive(duel) {
  const p = duel.player;
  const affordable = p.hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => card.cost <= p.ember);
  if (affordable.length === 0) return -1;
  const strike = affordable
    .filter(({ card }) => card.type === 'Strike')
    .sort((a, b) => b.card.value - a.card.value)[0];
  if (strike) return strike.i;
  return affordable.sort((a, b) => b.card.value - a.card.value)[0].i;
}

/** Pick a card that completes a same-suit pair first, then a strike. */
function pickPairFirst(duel) {
  const p = duel.player;
  const affordable = p.hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => card.cost <= p.ember);
  if (affordable.length === 0) return -1;
  const pair = affordable.find(({ card }) =>
    p.played.some((played) => played.suit === card.suit));
  if (pair) return pair.i;
  return pickAggressive(duel);
}

/**
 * Pick for a guaranteed Surge: if a suit is already on the table, complete
 * it; otherwise start a pair whose partner is still affordable afterwards.
 * The plain pair-first pick spends too much ember on its first card to
 * afford the second, so the cover would never show a Surge.
 */
function pickSurgePair(duel) {
  const p = duel.player;
  const affordable = p.hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => card.cost <= p.ember);
  if (affordable.length === 0) return -1;
  const finisher = affordable.find(({ card }) =>
    p.played.some((played) => played.suit === card.suit));
  if (finisher) return finisher.i;
  const starter = affordable.find(({ card, i }) =>
    p.hand.some((other, j) =>
      j !== i && other.suit === card.suit && other.cost <= p.ember - card.cost));
  if (starter) return starter.i;
  return pickAggressive(duel);
}

/** Play the player's whole turn with `pick`, then resolve the Warden. */
function playFullRound(duel, pick) {
  let guard = 0;
  while (!duel.winner && duel.phase === 'player') {
    const i = pick(duel);
    if (i < 0) break;
    // The table autopilot guards once when hurt, like a human would.
    const card = duel.player.hand[i];
    if (card.type === 'Guard' && duel.player.life > 8 && guard > 0) break;
    if (card.type === 'Guard') guard += 1;
    duel.playCard(duel.player, i);
  }
  if (duel.winner) return;
  duel.endPlayerTurn();
  duel.resolveWardenTurn((warden) => playWardenTurn(duel));
}

/** Five strong sample cards for the title screen's fanned hand. */
export function titleSampleCards() {
  const deck = buildDeckCards();
  const wanted = ['Ember Lash', 'Tide Mend', 'Thorn Wall', 'Gale Rush', 'Pyre Burst'];
  return wanted.map((name) => deck.find((c) => c.name === name));
}

/**
 * Stage one scene. Returns { duel, intentText, sampleCards }.
 * Seed search: try seeds 1..20 and keep the first whose simulation lands
 * the frame the screenshot needs (a Surge on the table, a real win, a
 * loss with damage actually dealt). The search itself is deterministic.
 */
export function stageShot(scene, seed = 1) {
  if (scene === 'title') {
    return { duel: new Duel(seed), intentText: '', sampleCards: titleSampleCards() };
  }

  if (scene === 'table') {
    for (let s = seed; s < seed + 20; s++) {
      const duel = new Duel(s).start();
      for (let r = 1; r <= 3 && !duel.winner; r++) playFullRound(duel, pickPairFirst);
      if (duel.winner) continue;
      // Into round 4: play a Surge pair so the callout shows on the cover.
      while (!duel.winner && duel.phase === 'player') {
        const i = pickSurgePair(duel);
        if (i < 0) break;
        duel.playCard(duel.player, i);
        if (duel.surgeCallout) break;
      }
      if (duel.winner) continue;
      if (!duel.surgeCallout) continue;
      if (duel.player.hand.length < 3) continue;
      if (duel.player.life <= 0 || duel.warden.life <= 0) continue;
      return { duel, intentText: wardenIntent(duel).text, sampleCards: [] };
    }
    // Fallback: the first seed's round-4 frame, surge or not.
    const duel = new Duel(seed).start();
    for (let r = 1; r <= 3 && !duel.winner; r++) playFullRound(duel, pickPairFirst);
    return { duel, intentText: wardenIntent(duel).text, sampleCards: [] };
  }

  if (scene === 'win') {
    // Aggressive autopilot: every strike it can afford, every round.
    // A win in 8 rounds or fewer, with 20+ damage dealt, is a real duel.
    for (let s = seed; s < seed + 20; s++) {
      const duel = new Duel(s).start();
      for (let r = 0; r < 30 && !duel.winner; r++) playFullRound(duel, pickAggressive);
      if (duel.winner === 'player' && duel.round <= 8 && duel.damageDealt >= 20) {
        return { duel, intentText: '', sampleCards: [] };
      }
    }
    const duel = new Duel(seed).start();
    for (let r = 0; r < 30 && !duel.winner; r++) playFullRound(duel, pickAggressive);
    return { duel, intentText: '', sampleCards: [] };
  }

  // loss: deal some real damage first (two aggressive rounds), then stop
  // playing entirely and let the Warden close the duel.
  for (let s = seed; s < seed + 20; s++) {
    const duel = new Duel(s).start();
    for (let r = 0; r < 2 && !duel.winner; r++) playFullRound(duel, pickAggressive);
    for (let r = 0; r < 30 && !duel.winner; r++) {
      duel.endPlayerTurn();
      duel.resolveWardenTurn((warden) => playWardenTurn(duel));
    }
    if (duel.winner === 'warden' && duel.damageDealt >= 5) {
      return { duel, intentText: '', sampleCards: [] };
    }
  }
  const duel = new Duel(seed).start();
  for (let r = 0; r < 30 && !duel.winner; r++) {
    duel.endPlayerTurn();
    duel.resolveWardenTurn((warden) => playWardenTurn(duel));
  }
  return { duel, intentText: '', sampleCards: [] };
}
