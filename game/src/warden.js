// warden.js — the Ashen Warden: telegraphed intent + card choice.
// One clear job: decide what the opponent does, and say so before it acts,
// so the player can read the banner and guard in response.

import { playCard } from './duel.js';

// Pick the warden's next card, or null when it passes. The logic is readable
// on purpose: lethal first, guard when hurt, else the biggest affordable
// card, preferring a card that completes a suit pair for the surge.
export function chooseCard(duel) {
  const w = duel.warden;
  const me = duel.player;
  const affordable = w.hand.filter((c) => c.cost <= w.ember);
  if (affordable.length === 0) return null;

  // Lethal: a strike that finishes the challenger right now, through block.
  const lethal = affordable
    .filter((c) => c.type === 'Strike')
    .find((c) => c.value >= me.life + me.block);
  if (lethal) return lethal;

  // Hurt: guard with the biggest block in hand.
  if (w.life <= 8) {
    const guards = affordable.filter((c) => c.type === 'Guard');
    if (guards.length > 0) {
      return guards.sort((a, b) => b.value - a.value)[0];
    }
  }

  // Complete a suit pair already started this round — the surge is worth it.
  const pair = affordable.find((c) => w.playedSuits.includes(c.suit));
  if (pair) return pair;

  // Start a pair: the cheapest card of a suit it holds twice and can afford.
  const bySuit = {};
  for (const c of affordable) (bySuit[c.suit] ??= []).push(c);
  for (const suit of Object.keys(bySuit)) {
    const cards = bySuit[suit].sort((a, b) => a.cost - b.cost);
    if (cards.length >= 2 && cards[0].cost + cards[1].cost <= w.ember) return cards[0];
  }

  // Otherwise the biggest strike, then the biggest anything.
  const strikes = affordable.filter((c) => c.type === 'Strike');
  if (strikes.length > 0) return strikes.sort((a, b) => b.value - a.value)[0];
  return affordable.sort((a, b) => b.value - a.value)[0];
}

// The banner text the player sees before the warden acts. Naming the exact
// card is the whole point: the opponent's choices must be readable.
export function planIntent(duel) {
  const pick = chooseCard(duel);
  if (!pick) {
    duel.intent = { text: 'Warden plans: HOLD — no ember to spend', card: null };
  } else {
    duel.intent = {
      text: `Warden plans: ${pick.name.toUpperCase()} ${pick.value}`,
      card: pick,
    };
  }
  return duel.intent;
}

// The warden's whole turn: up to three cards, then it stops. It re-picks
// after every card, so a surge or a draw can change its mind mid-turn.
export function wardenAct(duel) {
  planIntent(duel);
  for (let k = 0; k < 3; k++) {
    if (duel.phase === 'over') break;
    const pick = chooseCard(duel);
    if (!pick) break;
    playCard(duel, 'warden', pick.id);
    if (duel.phase === 'over') break;
  }
  return duel;
}
