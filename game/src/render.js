// Ember Court — rendering: the felt table, the hands, the life bars,
// the telegraph banner, the surge callout, and the title / win / loss
// screens. Everything is DOM + inline SVG; no external assets.
import { SUITS, TYPES, effectText } from './cards.js';
import { other } from './duel.js';

/** Inline SVG for a suit glyph, drawn in the suit's colour. */
export function suitGlyph(suit, size) {
  const s = SUITS[suit];
  const paths = {
    flame: 'M32 6 C40 18 52 26 52 42 A20 20 0 1 1 12 42 C12 32 20 28 24 20 C26 26 30 28 32 26 C30 18 30 12 32 6 Z',
    droplet: 'M32 4 C44 22 52 32 52 44 A20 20 0 1 1 12 44 C12 32 20 22 32 4 Z',
    thorn: 'M32 4 L38 22 L56 22 L42 34 L48 52 L32 42 L16 52 L22 34 L8 22 L26 22 Z',
    swirl: 'M32 4 L39 25 L60 32 L39 39 L32 60 L25 39 L4 32 L25 25 Z',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="${s.name}"><path d="${paths[s.glyph]}" fill="${s.color}" stroke="${s.dark}" stroke-width="2"/></svg>`;
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/** One face-up card. `opts.playable` marks it clickable; `opts.small` shrinks it. */
export function cardElement(card, opts = {}) {
  const s = SUITS[card.suit];
  const c = el('div', `card suit-${card.suit}${opts.playable ? ' playable' : ''}${opts.small ? ' small' : ''}`);
  c.dataset.cardId = card.id;
  c.setAttribute('aria-label', `${card.name}, ${s.name} ${TYPES[card.type].name} ${card.value}, costs ${card.cost} ember`);
  c.innerHTML = `
    <div class="card-cost" title="Ember cost">${card.cost}</div>
    <div class="card-glyph">${suitGlyph(card.suit, opts.small ? 34 : 44)}</div>
    <div class="card-value">${card.value}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-type">${s.name} · ${TYPES[card.type].name}</div>
    <div class="card-effect">${effectText(card)}</div>`;
  return c;
}

/** A face-down card back. */
export function cardBackElement() {
  const c = el('div', 'card card-back');
  c.innerHTML = '<div class="card-back-ember">❖</div><div class="card-back-word">EMBER<br>COURT</div>';
  return c;
}

/** A life bar with a big numeral: readable at thumbnail size. */
function lifeBar(side, fighter, label) {
  const pct = Math.max(0, (fighter.life / 20) * 100);
  const bar = el('div', `life ${side}`);
  bar.innerHTML = `
    <div class="life-label">${label}</div>
    <div class="life-track"><div class="life-fill" style="width:${pct}%"></div></div>
    <div class="life-num">${fighter.life}<span class="life-max">/20</span></div>
    ${fighter.block > 0 ? `<div class="block-badge">🛡 ${fighter.block} BLOCK</div>` : ''}`;
  return bar;
}

/** Ember pips: filled = available, empty = spent. */
function emberPips(fighter) {
  const pips = el('div', 'ember-pips');
  for (let i = 0; i < 10; i++) {
    const p = el('span', `pip${i < fighter.ember ? ' on' : ''}`, '●');
    pips.appendChild(p);
  }
  return pips;
}

/** The table screen: Warden across the top, your hand across the bottom. */
function renderTable(root, duel, ui) {
  const stage = el('div', 'screen table-screen');
  const top = el('div', 'topbar');
  top.innerHTML = `<span class="brand">EMBER COURT</span><span class="round-label">ROUND ${duel.round}</span><span class="score-label">SCORE ${duel.score} · DMG ${duel.you.damageDealt}</span>`;
  stage.appendChild(top);

  const foe = el('div', 'foe-zone');
  foe.appendChild(lifeBar('warden', duel.warden, 'ASHEN WARDEN'));
  const foeEmber = el('div', 'ember-row');
  foeEmber.appendChild(el('span', 'ember-caption', 'Warden ember'));
  foeEmber.appendChild(emberPips(duel.warden));
  foe.appendChild(foeEmber);
  const banner = el('div', `intent-banner intent-${ui.intent.kind}`, ui.intent.label);
  foe.appendChild(banner);
  const foeHand = el('div', 'hand foe-hand');
  for (let i = 0; i < duel.warden.hand.length; i++) foeHand.appendChild(cardBackElement());
  foe.appendChild(foeHand);
  stage.appendChild(foe);

  const mid = el('div', 'mid-row');
  if (duel.lastSurge) mid.appendChild(el('div', 'surge-callout', `⚡ ${duel.lastSurge}`));
  const logLine = duel.log.length > 0 ? duel.log[duel.log.length - 1] : 'Play a card, then End Round.';
  mid.appendChild(el('div', 'log-line', logLine));
  const endBtn = el('button', 'end-round', 'END ROUND ⏎');
  endBtn.id = 'end-round';
  mid.appendChild(endBtn);
  stage.appendChild(mid);

  const me = el('div', 'me-zone');
  me.appendChild(lifeBar('you', duel.you, 'YOU — EMBER WARDEN CHALLENGER'));
  const myEmber = el('div', 'ember-row');
  myEmber.appendChild(el('span', 'ember-caption', `Your ember ${duel.you.ember}/10`));
  myEmber.appendChild(emberPips(duel.you));
  me.appendChild(myEmber);
  const myHand = el('div', 'hand my-hand');
  duel.you.hand.forEach((card, i) => {
    const ce = cardElement(card, { playable: card.cost <= duel.you.ember });
    ce.dataset.handIndex = String(i);
    if (card.cost > duel.you.ember) ce.classList.add('unaffordable');
    myHand.appendChild(ce);
  });
  me.appendChild(myHand);
  stage.appendChild(me);
  root.appendChild(stage);
}

/** The title screen with a fanned sample hand. */
function renderTitle(root, duel) {
  const stage = el('div', 'screen title-screen');
  stage.innerHTML = `
    <div class="title-kicker">A DUEL OF EMBER AND OATH</div>
    <h1 class="game-title">EMBER COURT</h1>
    <div class="title-sub">Outplay the Ashen Warden. First ember to 0 loses.</div>
    <button class="play-btn" id="play-btn">▶ &nbsp;PLAY THE DUEL</button>
    <div class="howto">
      <div><b>1 ·</b> Cards cost ember. Ember grows +1 each round.</div>
      <div><b>2 ·</b> Two cards of the SAME SUIT in one round trigger a SURGE.</div>
      <div><b>3 ·</b> The Warden telegraphs its plan — read it, then guard.</div>
    </div>`;
  const sample = el('div', 'hand sample-hand');
  const sampleCards = [
    { id: 's1', name: 'Ember Lash', suit: 'flame', type: 'strike', value: 6, cost: 3 },
    { id: 's2', name: 'Tide Mend', suit: 'tide', type: 'guard', value: 6, cost: 3 },
    { id: 's3', name: 'Thorn Wall', suit: 'thorn', type: 'guard', value: 5, cost: 2 },
    { id: 's4', name: 'Gale Rush', suit: 'gale', type: 'strike', value: 4, cost: 2 },
    { id: 's5', name: 'Pyre Burst', suit: 'flame', type: 'strike', value: 8, cost: 5 },
  ];
  for (const c of sampleCards) sample.appendChild(cardElement(c, { small: true }));
  stage.appendChild(sample);
  stage.appendChild(el('div', 'title-foot', '20 life each · 4 suits · same-suit Surge combos · a Warden you can read'));
  root.appendChild(stage);
}

/** Win and loss screens with the final stats block. */
function renderEnd(root, duel) {
  const won = duel.winner === 'you';
  const stage = el('div', `screen end-screen ${won ? 'win' : 'loss'}`);
  stage.innerHTML = `
    <h1 class="end-title">${won ? '★ VICTORY ★' : 'DEFEAT'}</h1>
    <div class="end-sub">${won ? 'The Warden\u2019s ember is spent. The Court is yours.' : 'Your ember fades. The Warden keeps the Court — for now.'}</div>
    <div class="stats-block">
      <div><span>FINAL SCORE</span><b>${duel.score}</b></div>
      <div><span>ROUNDS</span><b>${duel.round}</b></div>
      <div><span>DAMAGE DEALT</span><b>${duel.you.damageDealt}</b></div>
      <div><span>YOUR LIFE</span><b>${duel.you.life} / 20</b></div>
      <div><span>WARDEN LIFE</span><b>${duel.warden.life} / 20</b></div>
    </div>
    <button class="play-btn" id="again-btn">${won ? '↻ &nbsp;PLAY AGAIN' : '↻ &nbsp;TRY AGAIN'}</button>`;
  root.appendChild(stage);
}

/** Render the whole stage for the duel's current phase. */
export function renderGame(root, duel, ui) {
  root.innerHTML = '';
  if (duel.phase === 'title') renderTitle(root, duel);
  else if (duel.phase === 'table') renderTable(root, duel, ui);
  else renderEnd(root, duel);
  if (duel.phase === 'win') root.classList.add('win-glow');
  else root.classList.remove('win-glow');
}
