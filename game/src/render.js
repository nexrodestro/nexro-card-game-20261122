// Ember Court — rendering: the table, hands, life bars, banners, end screens.
// All screens are plain DOM inside #stage (1280x720). Big numerals, suit
// colour + shape on every card, so the table reads at thumbnail size.
// v5: the table middle shows the cards played this round face-up (no more
// empty felt), and the win/loss screens stand alone — a clean panel with the
// final life totals, never text overlapping the table behind it.
import { SUITS, SURGE_RULES } from './cards.js';
import { scoreOf } from './duel.js';

export function suitSvg(suitKey, size) {
  const suit = SUITS[suitKey];
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="${suit.name}">`
    + `<path d="${suit.glyph}" fill="${suit.color}" stroke="${suit.dark}" stroke-width="1"/></svg>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

// One face-up card. `playable` marks cards the player can afford right now.
export function cardHtml(card, playable) {
  const suit = SUITS[card.suit];
  const big = card.type === 'Surge' ? 'x2' : String(card.value);
  return `<div class="card${playable ? ' playable' : ''}" data-id="${card.id}" `
    + `style="--suit:${suit.color};--suit-dark:${suit.dark}">`
    + `<div class="card-cost">◆ ${card.cost}</div>`
    + `<div class="card-glyph">${suitSvg(card.suit, 34)}</div>`
    + `<div class="card-value">${big}</div>`
    + `<div class="card-type">${card.type}</div>`
    + `<div class="card-name">${esc(card.name)}</div>`
    + `<div class="card-suit">${suit.name.toUpperCase()}</div></div>`;
}

// A played card, smaller — the middle row shows the round's plays face-up.
function playedCardHtml(card) {
  const suit = SUITS[card.suit];
  const big = card.type === 'Surge' ? 'x2' : String(card.value);
  return `<div class="card played" style="--suit:${suit.color};--suit-dark:${suit.dark}">`
    + `<div class="card-cost">◆ ${card.cost}</div>`
    + `<div class="card-glyph">${suitSvg(card.suit, 26)}</div>`
    + `<div class="card-value">${big}</div>`
    + `<div class="card-type">${card.type}</div>`
    + `<div class="card-name">${esc(card.name)}</div>`
    + `<div class="card-suit">${suit.name.toUpperCase()}</div></div>`;
}

function cardBackHtml(i) {
  return `<div class="card back" style="--rot:${(i - 2) * 4}deg">`
    + `<div class="back-glyph">${suitSvg('flame', 30)}</div>`
    + `<div class="back-mark">?</div></div>`;
}

function lifeHtml(who, combatant) {
  const pct = Math.max(0, (combatant.life / 20) * 100);
  const pips = Array.from({ length: 10 }, (_, i) => (i < combatant.ember ? '●' : '○')).join('');
  return `<div class="life-row">`
    + `<div class="life"><span class="life-num">${combatant.life}</span>`
    + `<div class="life-bar"><i style="width:${pct}%"></i></div>`
    + `<span class="life-label">EMBER</span></div>`
    + `<div class="ember">Ember ${combatant.ember} / 10 <span class="pips">${pips}</span></div>`
    + (combatant.block > 0 ? `<div class="block">🛡 Block ${combatant.block}</div>` : '')
    + `</div>`;
}

// The middle row: the last few cards played this round, face-up and centred.
// It fills the table's middle with the duel itself — no decorative emblem,
// no logo panel, just the plays that just happened.
function playedRowHtml(duel) {
  const played = (duel.playedThisRound || []).slice(-4);
  if (played.length === 0) return '';
  const cards = played.map((p) => playedCardHtml(p.card)).join('');
  return `<div class="played-row"><div class="played-label">PLAYED THIS ROUND</div>`
    + `<div class="played-cards">${cards}</div></div>`;
}

function tableHtml(duel) {
  const p = duel.player;
  const w = duel.warden;
  const wardenHand = w.hand.map((_, i) => cardBackHtml(i)).join('');
  const myHand = p.hand.map((c) => cardHtml(c, c.cost <= p.ember && duel.phase === 'play')).join('');
  const handClass = p.hand.length > 7 ? 'my-hand many' : 'my-hand';
  const surge = duel.lastSurge
    ? `<div class="surge-callout">⚡ ${duel.lastSurge.text}</div>`
    : '<div class="surge-callout empty">Play two cards of one suit to trigger its Surge</div>';
  return `<div class="topbar"><span class="brand">EMBER COURT</span>`
    + `<span class="round">Round ${duel.round}</span>`
    + `<span class="score">Score ${scoreOf(duel)}</span></div>`
    + `<div class="side warden-side"><div class="side-name">ASHEN WARDEN</div>`
    + lifeHtml('warden', w)
    + `<div class="warden-hand">${wardenHand}</div>`
    + `<div class="intent">${esc(duel.wardenIntent ? duel.wardenIntent.text : '')}</div></div>`
    + `<div class="middle">${playedRowHtml(duel)}${surge}<div class="log">${esc(duel.lastPlay)}</div></div>`
    + `<div class="side player-side"><div class="side-name">YOU — CHALLENGER</div>`
    + lifeHtml('player', p)
    + `<div class="${handClass}">${myHand}</div>`
    + `<div class="actions"><button id="end-round">End Round ⏎</button>`
    + `<span class="hint">Click a glowing card to play it · keys 1–5 play · Enter ends the round</span></div></div>`;
}

function titleHtml(duel) {
  const sample = duel.player.hand.slice(0, 5).map((c) => cardHtml(c, false)).join('');
  return `<div class="title-screen">`
    + `<h1>EMBER COURT</h1>`
    + `<p class="subtitle">A duel of ember and oath</p>`
    + `<div class="rules"><p>1 · Spend Ember to play cards — your pool grows bigger every round.</p>`
    + `<p>2 · Two cards of one suit in a round trigger its Surge.</p>`
    + `<p>3 · Read the Warden's plan, then guard — first to 0 Ember loses.</p></div>`
    + `<button id="play-btn">▶ Play the duel</button>`
    + `<div class="sample-hand">${sample}</div>`
    + `<p class="surge-note">${SURGE_RULES.flame} ${SURGE_RULES.tide}</p></div>`;
}

function endHtml(duel, won) {
  const title = won
    ? 'VICTORY — the Warden\'s ember is spent'
    : 'DEFEAT — your ember fades';
  const line = won
    ? 'The Ashen Warden bows. The Court is yours.'
    : 'The Warden stands over the dimmed table. Duel again.';
  return `<div class="end-screen ${won ? 'win' : 'loss'}">`
    + `<div class="end-title">${title}</div>`
    + `<p class="end-line">${line}</p>`
    + `<div class="end-stats">Warden ${duel.warden.life} Ember · You ${duel.player.life} Ember`
    + ` · Score ${scoreOf(duel)} · Rounds ${duel.stats.rounds || duel.round}`
    + ` · Damage dealt ${duel.stats.damage}</div>`
    + `<button id="again-btn">Play again</button></div>`;
}

export function render(stage, ui) {
  if (ui.screen === 'title') {
    stage.innerHTML = titleHtml(ui.duel);
  } else if (ui.screen === 'win') {
    // The end screen stands alone: a clean panel with the final totals.
    // Rendering the table behind it lets its banners and callouts show
    // through and overlap the headline — v3's win/loss shots had exactly
    // that ghost text, so the table is not drawn under an end screen.
    stage.innerHTML = endHtml(ui.duel, true);
  } else if (ui.screen === 'loss') {
    stage.innerHTML = endHtml(ui.duel, false);
  } else {
    stage.innerHTML = tableHtml(ui.duel);
  }
}
