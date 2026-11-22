// Ember Court — deterministic screenshot staging.
// ?shot=title|table|win|loss&seed=1 replays a real duel from a seeded RNG
// with a scripted autopilot, then renders one exact frame. Same seed, same
// frame: main.ts's two runs write identical screenshot bytes.
//   title: fresh duel, title screen.
//   table: a mid-duel table after several real rounds, a Surge fired.
//   win:   an aggressive autopilot closes the duel out.
//   loss:  a timid autopilot never strikes and loses.
import { Duel } from './duel.js';
import { planIntent, wardenTurn } from './warden.js';

/** Play the best affordable strike/guard greedily until the duel ends. */
function aggressiveTurn(duel) {
  let guard = 0;
  while (!duel.over && guard < 8) {
    guard++;
    const hand = duel.you.hand;
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < hand.length; i++) {
      const c = hand[i];
      if (c.cost > duel.you.ember) continue;
      let score = c.type === 'strike' ? c.value * 3 : c.type === 'surge' ? 5 : c.value;
      if (duel.you.playedSuits[c.suit] === 1) score += 8;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best < 0) break;
    duel.playCard('you', best);
  }
}

/** Play only guards and kindles; never strike. Loses on purpose. */
function timidTurn(duel) {
  let guard = 0;
  while (!duel.over && guard < 8) {
    guard++;
    const hand = duel.you.hand;
    let best = -1;
    for (let i = 0; i < hand.length; i++) {
      const c = hand[i];
      if (c.cost > duel.you.ember) continue;
      if (c.type === 'guard' || c.type === 'kindle') {
        best = i;
        break;
      }
    }
    if (best < 0) break;
    duel.playCard('you', best);
  }
}

/** Play at most 3 cards a round, preferring a same-suit pair so a Surge
 *  fires, so the table shot shows a live mid-duel with both lives moved. */
function balancedTurn(duel) {
  let played = 0;
  while (!duel.over && played < 3) {
    const hand = duel.you.hand;
    let idx = -1;
    for (let i = 0; i < hand.length && idx < 0; i++) {
      if (hand[i].cost > duel.you.ember) continue;
      if (duel.you.playedSuits[hand[i].suit] === 1) idx = i;
    }
    if (idx < 0) {
      for (let i = 0; i < hand.length && idx < 0; i++) {
        if (hand[i].cost > duel.you.ember) continue;
        const pair = hand.some((c, j) => j !== i && c.suit === hand[i].suit && c.cost <= duel.you.ember - hand[i].cost);
        if (pair) idx = i;
      }
    }
    if (idx < 0) {
      for (let i = 0; i < hand.length; i++) {
        if (hand[i].cost <= duel.you.ember && hand[i].type === 'strike' && (idx < 0 || hand[i].value > hand[idx].value)) idx = i;
      }
    }
    if (idx < 0) break;
    duel.playCard('you', idx);
    played++;
  }
}

/** One full round: player autopilot, then the Warden, then next round. */
function playRound(duel, style) {
  if (style === 'aggressive') aggressiveTurn(duel);
  else if (style === 'balanced') balancedTurn(duel);
  else if (style === 'timid') timidTurn(duel);
  if (duel.over) return;
  wardenTurn(duel);
  if (!duel.over) duel.nextRound();
}

/** Build the duel state for a screenshot scene. Returns { duel, intent }. */
export function stageShot(scene, seed = 1) {
  const duel = new Duel(seed);
  duel.phase = 'table';
  if (scene === 'title') {
    duel.phase = 'title';
    return { duel, intent: { kind: 'wait', label: '' } };
  }
  if (scene === 'table') {
    // Play real rounds until a Surge has fired and both lives have moved,
    // then stop mid-duel on a fresh round with a telegraph to read.
    let rounds = 0;
    let sawSurge = false;
    while (rounds < 8 && !duel.over) {
      playRound(duel, 'balanced');
      rounds++;
      if (duel.lastSurge) sawSurge = true;
      if (sawSurge && duel.you.life < 20 && duel.warden.life < 20) break;
    }
    if (duel.over) {
      // Overshot into an ending: rebuild and stop one round earlier.
      return stageShotTableFallback(seed);
    }
    return { duel, intent: planIntent(duel) };
  }
  if (scene === 'win') {
    let rounds = 0;
    while (!duel.over && rounds < 30) {
      playRound(duel, 'aggressive');
      rounds++;
    }
    return { duel, intent: { kind: 'done', label: '' } };
  }
  // loss
  let rounds = 0;
  while (!duel.over && rounds < 30) {
    playRound(duel, 'timid');
    rounds++;
  }
  return { duel, intent: { kind: 'done', label: '' } };
}

/** Table fallback: fewer rounds, so the duel is still live for the shot. */
function stageShotTableFallback(seed) {
  const duel = new Duel(seed);
  duel.phase = 'table';
  let rounds = 0;
  while (rounds < 3 && !duel.over) {
    playRound(duel, 'balanced');
    rounds++;
  }
  return { duel, intent: planIntent(duel) };
}
