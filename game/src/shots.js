// Ember Court — deterministic screenshot staging for ?shot=title|table|win|loss.
// Each scene plays the real rules forward from a fixed seed with a simple
// autopilot, so the same seed always renders the same frame. No clock, no
// Math.random anywhere in this file.
import { newDuel, playCard, endPlayerRound, startRound } from './duel.js';

// Surge-hunting autopilot: the pair is the point of the game, so the
// staging line saves ember for one instead of spending it all every round.
function greedyPlay(duel) {
  const me = duel.player;
  const bySuit = {};
  for (const c of me.hand) (bySuit[c.suit] ??= []).push(c);
  let cheapestPair = Infinity;
  for (const suit of Object.keys(bySuit)) {
    const pair = bySuit[suit].sort((a, b) => a.cost - b.cost).slice(0, 2);
    if (pair.length === 2) cheapestPair = Math.min(cheapestPair, pair[0].cost + pair[1].cost);
  }
  // 1. Fire an affordable same-suit pair right now.
  for (const suit of Object.keys(bySuit)) {
    const pair = bySuit[suit].sort((a, b) => a.cost - b.cost).slice(0, 2);
    if (pair.length === 2 && pair[0].cost + pair[1].cost <= me.ember) {
      playCard(duel, 'player', pair[0].id);
      playCard(duel, 'player', pair[1].id);
      return;
    }
  }
  // 2. A pair is in hand but not yet affordable: save ember for it, unless
  //    the pool is nearly full (then spend) or no pair can ever fire.
  if (cheapestPair <= 10 && cheapestPair > me.ember && me.ember < 9) return;
  // 3. Otherwise play up to two highest-value affordable cards, to cycle
  //    the hand toward a pair and keep pressure on the Warden.
  let played = 0;
  for (;;) {
    if (duel.winner || played >= 2) return;
    const hand = me.hand.filter((c) => c.cost <= me.ember);
    if (hand.length === 0) return;
    const pick = [...hand].sort((a, b) => b.value - a.value || a.cost - b.cost)[0];
    playCard(duel, 'player', pick.id);
    played++;
    if (duel.lastSurge) return;
  }
}

// Strikes only, highest first — the aggressive line that closes the duel.
function aggressivePlay(duel) {
  for (;;) {
    if (duel.winner) return;
    const strikes = duel.player.hand.filter(
      (c) => c.type === 'Strike' && c.cost <= duel.player.ember,
    );
    const any = strikes.length > 0
      ? strikes
      : duel.player.hand.filter((c) => c.cost <= duel.player.ember);
    if (any.length === 0) return;
    const pick = [...any].sort((a, b) => b.value - a.value)[0];
    playCard(duel, 'player', pick.id);
  }
}

export function stageShot(scene, seed = 1) {
  if (scene === 'title') {
    return { screen: 'title', duel: newDuel(seed) };
  }

  if (scene === 'table') {
    const duel = newDuel(seed);
    // Play at least 3 rounds so both life totals have moved, then keep going
    // until a Surge fires (the callout must be visible in the cover shot).
    for (let r = 0; r < 20 && !duel.winner; r++) {
      greedyPlay(duel);
      if (duel.winner) break;
      if (duel.lastSurge && duel.round >= 3) break;
      endPlayerRound(duel);
    }
    return { screen: 'table', duel };
  }

  if (scene === 'win') {
    const duel = newDuel(seed);
    // The Warden stands down in this staging line; the challenger closes it.
    for (let r = 0; r < 30 && !duel.winner; r++) {
      aggressivePlay(duel);
      if (duel.winner) break;
      startRound(duel);
    }
    return { screen: duel.winner === 'player' ? 'win' : 'table', duel };
  }

  if (scene === 'loss') {
    const duel = newDuel(seed);
    // The challenger never plays a card; the Warden strikes every round.
    for (let r = 0; r < 30 && !duel.winner; r++) {
      endPlayerRound(duel);
    }
    return { screen: duel.winner === 'warden' ? 'loss' : 'table', duel };
  }

  return { screen: 'title', duel: newDuel(seed) };
}
