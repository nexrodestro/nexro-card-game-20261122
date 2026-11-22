// Ember Court — the Ashen Warden: a readable, counterable opponent.
// The Warden telegraphs its intent before it acts, in a banner over its
// hand: "Warden plans: STRIKE 6". Read the banner, then guard.
// Logic, in order: kill if it can, guard when hurt, else play its best
// affordable card — preferring a same-suit pair so its Surge fires too.

/** What the Warden will do this round, for the telegraph banner. */
export function wardenIntent(duel) {
  const w = duel.warden;
  const p = duel.player;
  const affordable = w.hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => card.cost <= w.ember);
  if (affordable.length === 0) return { kind: 'PASS', text: 'Warden plans: PASS — no ember to spend' };

  const strikes = affordable.filter(({ card }) => card.type === 'Strike');
  const lethal = strikes.find(({ card }) => card.value >= p.life - p.block);
  if (lethal) return { kind: 'STRIKE', value: lethal.card.value, text: `Warden plans: STRIKE ${lethal.card.value} — lethal!` };

  if (w.life <= 8) {
    const guard = affordable
      .filter(({ card }) => card.type === 'Guard')
      .sort((a, b) => b.card.value - a.card.value)[0];
    if (guard) return { kind: 'GUARD', value: guard.card.value, text: `Warden plans: GUARD ${guard.card.value} — it is hurt` };
  }

  const best = affordable
    .slice()
    .sort((a, b) => b.card.value - a.card.value || a.card.cost - b.card.cost)[0];
  return { kind: best.card.type.toUpperCase(), value: best.card.value, text: `Warden plans: ${best.card.type.toUpperCase()} ${best.card.value}` };
}

/** Play the Warden's turn: its best affordable cards until its ember runs out. */
export function playWardenTurn(duel) {
  const w = duel.warden;
  const p = duel.player;
  let guard = 0;
  while (!duel.winner) {
    const affordable = w.hand
      .map((card, i) => ({ card, i }))
      .filter(({ card }) => card.cost <= w.ember);
    if (affordable.length === 0) break;
    // Kill if possible.
    const lethal = affordable
      .filter(({ card }) => card.type === 'Strike')
      .find(({ card }) => card.value >= p.life - p.block);
    let pick = lethal;
    // Hurt Warden guards once, then attacks.
    if (!pick && w.life <= 8 && guard === 0) {
      pick = affordable
        .filter(({ card }) => card.type === 'Guard')
        .sort((a, b) => b.card.value - a.card.value)[0];
      if (pick) guard += 1;
    }
  // Otherwise prefer a card that completes a same-suit pair — the Warden
  // chases its Surge just like you do — then the highest-value card.
  if (!pick) {
      const pair = affordable.find(({ card }) =>
        w.played.some((played) => played.suit === card.suit));
      pick = pair || affordable
        .slice()
        .sort((a, b) => b.card.value - a.card.value || a.card.cost - b.card.cost)[0];
    }
    duel.playCard(w, pick.i);
  }
  duel.log = 'The Warden has acted. Your move.';
}
