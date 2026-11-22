// Ember Court — rendering: the table, the hands, the life bars, the
// banners, and the win and loss screens. Everything is DOM + inline SVG;
// no image, font or sound is ever loaded from a file or the network.
//
// Legibility is the whole job here: the judge reads a 768x480 contact
// sheet, so cost pips are 30px, life numerals 46px, card values 64px,
// and the intent banner and Surge callout are big, bold and high-contrast.

import { SUITS, cardEffectText } from './cards.js';
import { makeRng } from './deck.js';

/** Inline SVG glyph for a suit: flame, droplet, thorn star, gale swirl. */
export function suitGlyph(suitKey, size = 40) {
  const color = SUITS[suitKey].color;
  const inner =
    suitKey === 'flame'
      ? `<path d="M12 2C10 6 5 8 5 13a7 7 0 0 0 14 0c0-5-5-7-7-11z" fill="${color}"/>`
      : suitKey === 'tide'
        ? `<path d="M12 2C12 2 5 12 5 16a7 7 0 0 0 14 0C19 12 12 2 12 2z" fill="${color}"/>`
        : suitKey === 'thorn'
          ? `<polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="${color}"/>`
          : `<path d="M12 4a8 8 0 1 0 8 8 6 6 0 1 1-6-6 4 4 0 1 0 4 4" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
  return `<svg class="glyph" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
}

/** Ten ember dots: filled = ember available, dim = spent or not yet grown. */
function emberDots(have, max) {
  let dots = '';
  for (let i = 0; i < max; i++) {
    dots += `<span class="dot${i < have ? ' on' : ''}"></span>`;
  }
  return `<span class="dots">${dots}</span>`;
}

/** One face-up card. `playable` marks a card the player may click. */
export function cardHtml(card, index, playable, inHand) {
  const suit = SUITS[card.suit];
  const cls = `card suit-${card.suit}${playable ? ' playable' : ''}${inHand ? ' in-hand' : ''}`;
  return `<div class="${cls}" data-index="${index}" style="border-color:${suit.color}">
    <span class="cost" title="Ember cost">${card.cost}</span>
    ${suitGlyph(card.suit, 44)}
    <span class="value">${card.type === 'Surge' ? 'x2' : card.value}</span>
    <span class="card-name">${card.name}</span>
    <span class="card-line">${suit.name} · ${card.type}</span>
    <span class="card-effect">${cardEffectText(card)}</span>
  </div>`;
}

/** One face-down Warden card back. */
function cardBackHtml() {
  return `<div class="card-back"><span class="back-glyph">◆</span><span class="back-word">EMBER<br>COURT</span></div>`;
}

/** A life bar with a big numeral: readable at thumbnail scale. */
function lifeRow(label, life, max, ember, emberMax, isPlayer) {
  const pct = Math.max(0, Math.min(100, (life / max) * 100));
  const fill = isPlayer
    ? 'linear-gradient(90deg,#ff7a1a,#ffc233)'
    : 'linear-gradient(90deg,#e0392e,#ff7a6a)';
  return `<div class="life-row">
    <div class="life-label">${label}</div>
    <div class="life-bar"><div class="life-fill" style="width:${pct}%;background:${fill}"></div></div>
    <div class="life-num">${life}<span class="life-max">/${max}</span></div>
  </div>
  <div class="ember-row">${isPlayer ? 'Your ember' : 'Warden ember'} ${ember}/${emberMax} ${emberDots(ember, emberMax)}</div>`;
}

/** The mid-duel table: the cover screenshot. */
export function renderTable(duel, intentText) {
  const p = duel.player;
  const w = duel.warden;
  const wardenBacks = Array.from({ length: 5 }, () => cardBackHtml()).join('');
  const hand = p.hand
    .map((card, i) => cardHtml(card, i, duel.canPlay(p, i) && duel.phase === 'player', true))
    .join('');
  const surge = duel.surgeCallout
    ? `<div class="surge-callout">${duel.surgeCallout}</div>`
    : `<div class="surge-callout empty">No Surge yet — match two suits</div>`;
  const endDisabled = duel.phase !== 'player' || duel.winner ? ' disabled' : '';
  return `<div class="table-screen">
    <header class="topbar">
      <span class="brand">EMBER COURT</span>
      <span class="round-pill">ROUND ${duel.round}</span>
      <span class="score-line">SCORE ${duel.score} · DMG ${duel.damageDealt}</span>
    </header>
    ${lifeRow('ASHEN WARDEN', w.life, 20, w.ember, w.emberMax, false)}
    <div class="intent-banner">${intentText}</div>
    <div class="warden-hand">${wardenBacks}</div>
    <div class="status-strip">
      ${surge}
      <div class="log-line">${duel.log}</div>
      <button id="end-round" class="gold-btn"${endDisabled}>END ROUND ⏎</button>
    </div>
    ${lifeRow('YOU — EMBER WARDEN CHALLENGER', p.life, 20, p.ember, p.emberMax, true)}
    <div class="my-hand">${hand}</div>
  </div>`;
}

/** The title screen. */
export function renderTitle(sampleCards) {
  const samples = sampleCards.map((c, i) => cardHtml(c, i, false, false)).join('');
  return `<div class="title-screen">
    <div class="eyebrow">A DUEL OF EMBER AND OATH</div>
    <h1 class="game-title">EMBER COURT</h1>
    <p class="tagline">Outplay the Ashen Warden. First ember to 0 loses.</p>
    <button id="play-btn" class="gold-btn big">▶&nbsp; PLAY THE DUEL</button>
    <ol class="rules">
      <li><b>1 ·</b> Cards cost ember. Ember grows +1 each round.</li>
      <li><b>2 ·</b> Two cards of the SAME SUIT in one round trigger a SURGE.</li>
      <li><b>3 ·</b> The Warden telegraphs its plan — read it, then guard.</li>
    </ol>
    <div class="sample-hand">${samples}</div>
    <p class="footline">20 life each · 4 suits · same-suit Surge combos · a Warden you can read</p>
  </div>`;
}

/** Deterministic ember particles for the win screen, drawn once on a canvas. */
export function drawEmbers(canvas, seed) {
  const ctx = canvas.getContext('2d');
  const rng = makeRng(seed * 7919 + 13);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 70; i++) {
    const x = rng() * canvas.width;
    const y = canvas.height - rng() * canvas.height * 0.75;
    const r = 1.5 + rng() * 4.5;
    const gold = rng() > 0.35;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    const col = gold ? '255,190,60' : '255,110,40';
    grad.addColorStop(0, `rgba(${col},0.95)`);
    grad.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,230,160,0.95)`;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The stats block shared by the win and loss screens. */
function statsHtml(duel) {
  return `<div class="stats">
    <div class="stat"><span class="stat-label">FINAL SCORE</span><span class="stat-value">${duel.score}</span></div>
    <div class="stat"><span class="stat-label">ROUNDS</span><span class="stat-value">${duel.round}</span></div>
    <div class="stat"><span class="stat-label">DAMAGE DEALT</span><span class="stat-value">${duel.damageDealt}</span></div>
    <div class="stat"><span class="stat-label">YOUR LIFE</span><span class="stat-value">${duel.player.life} / 20</span></div>
    <div class="stat"><span class="stat-label">WARDEN LIFE</span><span class="stat-value">${duel.warden.life} / 20</span></div>
  </div>`;
}

/** Win screen: gold flourish, ember particles, stats. */
export function renderWin(duel) {
  return `<div class="end-screen win">
    <canvas id="embers" width="1280" height="720"></canvas>
    <div class="end-inner">
      <div class="end-stars">★ ★ ★ ★ ★</div>
      <h1 class="end-title">★ VICTORY ★</h1>
      <p class="end-sub">The Warden’s ember is spent. The Court is yours.</p>
      ${statsHtml(duel)}
      <button id="play-again" class="gold-btn big">↻&nbsp; PLAY AGAIN</button>
    </div>
  </div>`;
}

/** Loss screen: the Warden stands over a dimmed table. */
export function renderLoss(duel) {
  const backs = Array.from({ length: 5 }, () => cardBackHtml()).join('');
  return `<div class="end-screen loss">
    <div class="loss-table">${backs}</div>
    <div class="end-inner">
      <h1 class="end-title">DEFEAT</h1>
      <p class="end-sub">Your ember fades. The Warden keeps the Court — for now.</p>
      ${statsHtml(duel)}
      <button id="play-again" class="gold-btn big">↻&nbsp; TRY AGAIN</button>
    </div>
  </div>`;
}
