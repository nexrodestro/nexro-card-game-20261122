// Ember Court — the Ashen Warden: a readable, counterable AI opponent.
// Before it acts, it telegraphs its intent in a banner over its hand, so the
// player can read the plan and guard in response. Pure function of the duel
// state: no randomness, so the same seed always telegraphs the same plan.
export function computeIntent(duel) {
  const w = duel.warden;
  const p = duel.player;
  const affordable = w.hand.filter((c) => c.cost <= w.ember);
  const strikes = affordable.filter((c) => c.type === 'Strike');

  // Lethal: if the Warden's strikes finish the player, it does so — but only
  // with a subset it can actually afford this round, highest value first.
  const lethalPlan = [];
  let lethalCost = 0;
  let lethalDamage = 0;
  for (const c of [...strikes].sort((a, b) => b.value - a.value)) {
    if (lethalCost + c.cost > w.ember) continue;
    lethalPlan.push(c);
    lethalCost += c.cost;
    lethalDamage += c.value;
  }
  if (lethalPlan.length > 0 && lethalDamage >= p.life) {
    return {
      kind: 'strike',
      text: `Warden plans: STRIKE ${lethalDamage} — lethal`,
      cards: lethalPlan.map((c) => c.id),
    };
  }

  // Hurt: guard up instead of attacking.
  if (w.life <= 8) {
    const guards = affordable
      .filter((c) => c.type === 'Guard')
      .sort((a, b) => b.value - a.value);
    if (guards.length > 0) {
      return {
        kind: 'guard',
        text: `Warden plans: GUARD ${guards[0].value}`,
        cards: [guards[0].id],
      };
    }
  }

  // Prefer a same-suit pair: two cards of one suit trigger that suit's Surge.
  const bySuit = {};
  for (const c of affordable) (bySuit[c.suit] ??= []).push(c);
  for (const suit of Object.keys(bySuit)) {
    if (bySuit[suit].length >= 2) {
      const pair = bySuit[suit]
        .sort((a, b) => b.value - a.value || a.cost - b.cost)
        .slice(0, 2);
      return {
        kind: 'surge',
        text: `Warden plans: ${suit.toUpperCase()} SURGE`,
        cards: pair.map((c) => c.id),
      };
    }
  }

  // Otherwise play the single highest-value affordable card.
  const best = [...affordable].sort((a, b) => b.value - a.value || a.cost - b.cost)[0];
  if (best) {
    return {
      kind: 'play',
      text: `Warden plans: ${best.type.toUpperCase()} ${best.type === 'Surge' ? 'x2' : best.value}`,
      cards: [best.id],
    };
  }

  return { kind: 'wait', text: 'Warden plans: WAIT — saving ember', cards: [] };
}
