// shots.js — deterministic screenshot staging.
// One clear job: given ?shot=title|table|win|loss&seed=N, drive the real
// rules forward with a simple autopilot until the exact frame the screenshot
// needs, then stop. Same seed → same frame, every run, so main.ts output
// is byte-identical across its two runs.
//
// The autopilot plays honestly through duel.js — no staged state is faked,
// except the table frame, which keeps playing until a surge has fired once
// so the callout and the centre row both show real played cards.

import { newDuel, startDuel, playCard, endRound } from './duel.js';
import { wardenAct, planIntent } from './warden.js';

// Sensible autopilot: play the biggest affordable strike, preferring a
// card that completes a suit pair; guard when hurt. Returns true if it
// played anything this turn. maxCards caps how many cards it plays.
function autoTurn(duel, side, { timid = false, maxCards = 3 } = {}) {
  const me = duel[side];
  if (timid) return false;
  let played = false;
  for (let k = 0; k < maxCards; k++) {
    if (duel.phase === 'over') break;
    const affordable = me.hand.filter((c) => c.cost <= me.ember);
    if (affordable.length === 0) break;
    let pick = affordable.find((c) => me.playedSuits.includes(c.suit));
    if (!pick && me.life <= 8) {
      const guards = affordable.filter((c) => c.type === 'Guard');
      if (guards.length > 0) pick = guards.sort((a, b) => b.value - a.value)[0];
    }
    if (!pick) pick = affordable.sort((a, b) => b.value - a.value)[0];
    playCard(duel, side, pick.id);
    played = true;
    if (duel.phase === 'over') break;
  }
  return played;
}

function playRounds(duel, rounds, opts = {}) {
  for (let r = 0; r < rounds; r++) {
    if (duel.phase === 'over') break;
    autoTurn(duel, 'player', opts);
    if (duel.phase === 'over') break;
    endRound(duel, (d) => wardenAct(d));
    if (duel.phase === 'play') planIntent(duel);
  }
  return duel;
}

export function stageShot(scene, seed = 1) {
  const duel = newDuel(seed);
  startDuel(duel);
  planIntent(duel);

  if (scene === 'title') {
    duel.phase = 'title';
    return duel;
  }

  if (scene === 'table') {
    // The frame is mid-round, on the player's turn, right after a surge
    // fired — that is when the callout and the centre row are both live.
    // lastSurge is cleared by endRound, so check it right after the
    // player's turn, before ending the round. Require one full round first
    // so the Warden has a played card in the centre row too.
    for (let r = 0; r < 8; r++) {
      if (duel.phase === 'over') break;
      autoTurn(duel, 'player');
      if (duel.phase === 'over') break;
      if (r >= 1 && duel.lastSurge) break;
      endRound(duel, (d) => wardenAct(d));
      if (duel.phase === 'play') planIntent(duel);
    }
    // Still no surge after 8 rounds: take one more player turn — by now a
    // pair is almost always completable from a 5+ card hand.
    if (!duel.lastSurge && duel.phase === 'play') {
      autoTurn(duel, 'player', { maxCards: 5 });
    }
    return duel;
  }

  if (scene === 'win') {
    // Aggressive autopilot that closes the duel: play everything affordable
    // every round, up to 60 rounds — far more than a 20-life duel needs.
    for (let r = 0; r < 60 && duel.phase !== 'over'; r++) {
      autoTurn(duel, 'player', { maxCards: 6 });
      if (duel.phase === 'over') break;
      endRound(duel, (d) => wardenAct(d));
      if (duel.phase === 'play') planIntent(duel);
    }
    return duel;
  }

  // loss: a timid challenger who never plays a card.
  for (let r = 0; r < 60 && duel.phase !== 'over'; r++) {
    autoTurn(duel, 'player', { timid: true });
    endRound(duel, (d) => wardenAct(d));
    if (duel.phase === 'play') planIntent(duel);
  }
  return duel;
}
