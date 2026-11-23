// render.js — the table, hands, life bars, banners, win/loss screens.
// One clear job: turn duel state into DOM. It never changes the rules;
// input.js and shots.js change state, then call render(ui).
//
// v4 change (weakest dimension — the table middle was an empty green void):
// a Court centre strip sits between the two hands: the last card each side
// played, face up, flanking a gold court emblem with round + score, with the
// Surge callout and the round log underneath. The centre proves depth in
// one frame and gives the cover something to show between the hands.

import { SUITS, TYPES, describeCard } from './cards.js';

const GLYPHS = {
  flame:
    '<path d="M12 2 C9 6 4 9 4 14 a8 8 0 0 0 16 0 C20 9 15 6 12 2 Z M12 11 C10 13 9 14 9 16 a3 3 0 0 0 6 0 C15 14 14 13 12 11 Z"/>',
  tide:
    '<path d="M12 2 C12 2 4 11 4 16 a8 8 0 0 0 16 0 C20 11 12 2 12 2 Z M9 16 a3 3 0 0 0 3 3"/>',
  thorn:
    '<path d="M12 1 L14.5 8 L21 5.5 L16.5 11 L23 13 L15.5 14.5 L15 22 L12 15.5 L9 22 L8.5 14.5 L1 13 L7.5 11 L3 5.5 L9.5 8 Z"/>',
  gale:
    '<path d="M12 12 m-8 0 a8 8 0 1 1 8 8 a6 6 0 1 1 -6 -6 a4 4 0 1 0 4 4" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
};

export function glyph(suit, size = 40) {
  const s = SUITS[suit];
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="${s.name}"><g fill="${s.color}" stroke="${s.color}">${GLYPHS[suit]}</g></svg>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// One face-up card. Big value, big cost pip, suit glyph — readable at
// thumbnail size, told apart by colour AND shape, never text alone.
export function cardHtml(card, opts = {}) {
  const s = SUITS[card.suit];
  const playable = opts.playable ? ' playable' : '';
  const fresh = opts.fresh ? ' deal' : '';
  const mini = opts.mini ? ' mini' : '';
  return `<div class="card suit-${card.suit}${playable}${fresh}${mini}" data-id="${card.id}" title="${esc(card.name)} — ${esc(describeCard(card))}, costs ${card.cost} ember">
    <div class="cost" style="background:${s.dark}">${card.cost}</div>
    <div class="glyph">${glyph(card.suit, opts.mini ? 26 : 44)}</div>
    <div class="value">${card.value}</div>
    <div class="cname">${esc(card.name)}</div>
    <div class="ctype" style="color:${s.color}">${TYPES[card.type].label}</div>
  </div>`;
}

function lifeBar(side, label) {
  const pct = Math.max(0, Math.round((side.life / 20) * 100));
  const block = side.block > 0 ? `<span class="block-pill">${side.block} BLOCK</span>` : '';
  const reflect = side.reflect > 0 ? `<span class="block-pill">${side.reflect} REFLECT</span>` : '';
  return `<div class="life-wrap">
    <div class="life-label">${label}</div>
    <div class="life-bar"><div class="life-fill" style="width:${pct}%"></div></div>
    <div class="life-num">${side.life}</div>
    ${block}${reflect}
  </div>`;
}

function emberPool(side) {
  let pips = '';
  for (let i = 0; i < 10; i++) {
    pips += `<span class="ember-pip${i < side.ember ? ' lit' : ''}"></span>`;
  }
  return `<div class="ember-pool" title="Ember — spend it to play cards">${pips}<span class="ember-num">${side.ember}</span></div>`;
}

function playedMini(duel, side) {
  const plays = duel.lastPlays.filter((p) => p.side === side);
  if (plays.length === 0) {
    return `<div class="played-empty">— no card played yet —</div>`;
  }
  return cardHtml(plays[plays.length - 1].card, { mini: true });
}

export function createUI(stage) {
  return {
    stage,
    duel: null,
    prevHandIds: new Set(),
    screen: 'title',
  };
}

export function render(ui) {
  const duel = ui.duel;
  if (!duel || duel.phase === 'title') {
    renderTitle(ui);
    return;
  }
  if (duel.phase === 'over') {
    renderEnd(ui);
    return;
  }
  renderTable(ui);
}

function renderTitle(ui) {
  ui.screen = 'title';
  const sample = [
    { id: 's1', name: 'Ember Slash', suit: 'flame', type: 'Strike', cost: 2, value: 5 },
    { id: 's2', name: 'Tidewall', suit: 'tide', type: 'Guard', cost: 2, value: 5 },
    { id: 's3', name: 'Thornwall', suit: 'thorn', type: 'Guard', cost: 3, value: 7 },
    { id: 's4', name: 'Gale Rush', suit: 'gale', type: 'Strike', cost: 2, value: 5 },
    { id: 's5', name: 'Pyre Burst', suit: 'flame', type: 'Strike', cost: 4, value: 8 },
  ];
  ui.stage.innerHTML = `<div class="title-screen">
    <div class="title-glyph">${glyph('flame', 72)}</div>
    <h1 class="game-title">EMBER COURT</h1>
    <p class="subtitle">A duel of ember and oath — first ember to zero loses.</p>
    <div class="sample-hand">${sample.map((c) => cardHtml(c)).join('')}</div>
    <button id="play-btn" class="big-btn">⚔ PLAY THE DUEL</button>
    <div class="howto">
      <div><b>1.</b> Spend ember to play cards — it grows every round.</div>
      <div><b>2.</b> Two cards of one suit fire a <b>Surge</b> — Flame burns, Tide heals, Thorn reflects, Gale draws.</div>
      <div><b>3.</b> Read the Warden's plan above its hand, then guard or strike back.</div>
    </div>
    <p class="foot">Click a card to play it · keys 1–5 play hand slots · Enter ends the round</p>
  </div>`;
}

function renderTable(ui) {
  const duel = ui.duel;
  ui.screen = 'table';
  const w = duel.warden;
  const p = duel.player;
  const freshIds = new Set(p.hand.map((c) => c.id));
  const newIds = [...freshIds].filter((id) => !ui.prevHandIds.has(id));
  ui.prevHandIds = freshIds;

  const backs = Array.from({ length: w.hand.length }, () => `<div class="card back"><div class="back-glyph">${glyph('flame', 34)}</div><div class="back-label">WARDEN</div></div>`).join('');
  const hand = p.hand.map((c) => cardHtml(c, {
    playable: c.cost <= p.ember && duel.phase === 'play',
    fresh: newIds.includes(c.id),
  })).join('');

  const surge = duel.lastSurge
    ? `<div class="surge-callout">${esc(duel.lastSurge.text)}</div>`
    : `<div class="surge-callout empty">Play two cards of one suit to fire a Surge</div>`;
  const lastLog = duel.log.length ? esc(duel.log[duel.log.length - 1]) : `Round ${duel.round} — your move, challenger.`;
  const intent = duel.intent ? esc(duel.intent.text) : 'Warden plans: …';

  ui.stage.innerHTML = `<div class="table-screen">
    <div class="top-row">
      <div class="foe-name">🔥 THE ASHEN WARDEN</div>
      ${lifeBar(w, 'WARDEN EMBER')}
      <div class="foe-ember">${emberPool(w)}</div>
    </div>
    <div class="foe-hand">${backs}</div>
    <div class="intent-banner">${intent}</div>
    <div class="court-centre">
      <div class="played-col">
        <div class="played-label">WARDEN PLAYED</div>
        ${playedMini(duel, 'warden')}
      </div>
      <div class="court-emblem">
        <div class="emblem-glyph">${glyph('flame', 54)}</div>
        <div class="emblem-name">EMBER COURT</div>
        <div class="emblem-meta">Round ${duel.round} &nbsp;·&nbsp; Score ${duel.score}</div>
      </div>
      <div class="played-col">
        <div class="played-label">YOU PLAYED</div>
        ${playedMini(duel, 'player')}
      </div>
    </div>
    ${surge}
    <div class="round-log">${lastLog}</div>
    <div class="my-hand">${hand}</div>
    <div class="bottom-row">
      ${lifeBar(p, 'YOUR EMBER')}
      <div class="my-ember">${emberPool(p)}</div>
      <div class="round-score">ROUND <b>${duel.round}</b> &nbsp;·&nbsp; SCORE <b>${duel.score}</b></div>
      <button id="end-round" class="big-btn small">END ROUND ⏎</button>
    </div>
  </div>
  <canvas id="fx" class="fx-layer"></canvas>`;
}

function renderEnd(ui) {
  const duel = ui.duel;
  ui.screen = duel.winner === 'player' ? 'win' : 'loss';
  const win = duel.winner === 'player';
  const title = win ? 'VICTORY' : 'DEFEAT';
  const line = win
    ? 'The Warden\u2019s ember is spent — the Court is yours.'
    : 'Your ember fades — the Warden keeps the Court.';
  ui.stage.innerHTML = `<div class="end-screen ${win ? 'win' : 'loss'}">
    <div class="end-glyph">${glyph(win ? 'flame' : 'thorn', 64)}</div>
    <h1 class="end-title">${title}</h1>
    <p class="end-line">${line}</p>
    <div class="end-stats">
      <div><span>Score</span><b>${duel.score}</b></div>
      <div><span>Rounds</span><b>${duel.round}</b></div>
      <div><span>Damage dealt</span><b>${duel.player.damageDealt}</b></div>
      <div><span>Your ember</span><b>${duel.player.life}</b></div>
      <div><span>Warden ember</span><b>${duel.warden.life}</b></div>
    </div>
    <button id="play-btn" class="big-btn">${win ? '⚔ PLAY AGAIN' : '⚔ TRY AGAIN'}</button>
    <p class="foot">Ember Court — a duel of ember and oath</p>
  </div>
  <canvas id="fx" class="fx-layer"></canvas>`;
}
