// Ember Court — the Ashen Warden: a readable, counterable AI opponent.
// Before it acts, it TELEGRAPHS its intent in a banner over its hand, so
// the player can read the plan and guard in response. Logic, in order:
// lethal strike if it can finish you; guard while its own life is low;
// otherwise its highest-value affordable card, preferring a card that
// completes a same-suit pair for a Surge.
import { other } from './duel.js';

/** The Warden's cheapest lethal strike, or null. */
function lethalStrike(duel) {
  const w = duel.warden;
  const you = duel.you;
  let best = null;
  for (let i = 0; i < w.hand.length; i++) {
    const c = w.hand[i];
    if (c.type !== 'strike' || c.cost > w.ember) continue;
    const suitBonus = w.playedSuits[c.suit] === 1 && c.suit === 'flame' ? 3 : 0;
    const dmg = c.value * (w.surgeReady ? c.value : 1) + suitBonus;
    const hurt = Math.max(0, dmg - you.block);
    if (hurt >= you.life && (!best || c.value > w.hand[best].value)) best = i;
  }
  return best;
}

/** The Warden's best guard while it is hurt, or null. */
function bestGuard(duel) {
  const w = duel.warden;
  let best = null;
  for (let i = 0; i < w.hand.length; i++) {
    const c = w.hand[i];
    if (c.type !== 'guard' || c.cost > w.ember) continue;
    if (best === null || c.value > w.hand[best].value) best = i;
  }
  return best;
}

/** Highest-value affordable card, preferring a suit-pair finisher. */
function bestPlay(duel) {
  const w = duel.warden;
  let best = null;
  let bestScore = -1;
  for (let i = 0; i < w.hand.length; i++) {
    const c = w.hand[i];
    if (c.cost > w.ember) continue;
    // The Warden is a duelist, not a wall: strikes lead, guards are a
    // fallback (its low-life guard branch lives in planIntent instead).
    let score = c.type === 'strike' ? c.value * 3 - c.cost : c.value - c.cost;
    if (w.playedSuits[c.suit] === 1) score += 6;
    if (c.type === 'surge' && w.hand.some((d, j) => j !== i && d.cost <= w.ember - c.cost)) score += 4;
    if (c.type === 'kindle') score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** What the Warden plans to do next turn — shown as its telegraph banner. */
export function planIntent(duel) {
  if (duel.over) return { kind: 'done', label: 'The duel is over.' };
  const kill = lethalStrike(duel);
  if (kill !== null) {
    const c = duel.warden.hand[kill];
    return { kind: 'strike', label: `Warden plans: STRIKE ${c.value} — lethal!`, cardIndex: kill };
  }
  if (duel.warden.life <= 8) {
    const g = bestGuard(duel);
    if (g !== null) {
      const c = duel.warden.hand[g];
      return { kind: 'guard', label: `Warden plans: GUARD ${c.value}`, cardIndex: g };
    }
  }
  const play = bestPlay(duel);
  if (play === null) return { kind: 'wait', label: 'Warden plans: hold — no ember to spend' };
  const c = duel.warden.hand[play];
  const verb = c.type === 'strike' ? 'STRIKE' : c.type === 'guard' ? 'GUARD' : c.type === 'kindle' ? 'KINDLE' : 'SURGE';
  return { kind: c.type, label: `Warden plans: ${verb} ${c.value}`, cardIndex: play };
}

/** The Warden takes its turn: play its plan, then keep playing while it can. */
export function wardenTurn(duel) {
  const played = [];
  if (duel.over) return played;
  let guard = 0;
  while (!duel.over && guard < 6) {
    guard++;
    const intent = planIntent(duel);
    if (intent.kind === 'wait' || intent.cardIndex === undefined) break;
    const before = duel.warden.hand.length;
    duel.playCard('warden', intent.cardIndex);
    played.push(intent.label);
    if (duel.warden.hand.length === before) break;
    if (duel.warden.ember <= 0) break;
  }
  return played;
}
