// Ember Court — boot: interactive play, or a deterministic ?shot= frame.
// Interactive: title screen -> table -> win/loss, with the Warden's
// telegraph refreshed every round. Screenshot mode renders one staged
// frame and stops (no timers, no randomness) so the frame reproduces.
import { Duel } from './duel.js';
import { planIntent, wardenTurn } from './warden.js';
import { renderGame } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';
import { sfx } from './sound.js';

const root = document.getElementById('stage');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let duel = new Duel(seed);
let intent = { kind: 'wait', label: 'The Warden is thinking…' };

function refresh() {
  intent = duel.phase === 'table' && !duel.over ? planIntent(duel) : intent;
  renderGame(root, duel, { intent });
}

function startGame() {
  duel = new Duel(seed);
  duel.phase = 'table';
  intent = planIntent(duel);
  refresh();
}

const actions = {
  playCard(i) {
    if (duel.phase !== 'table' || duel.over) return;
    const before = duel.you.hand.length;
    const events = duel.playCard('you', i);
    if (duel.you.hand.length === before) return;
    if (events.some((e) => e.kind === 'suit-surge')) sfx.surge();
    else if (events.some((e) => e.kind === 'damage')) sfx.damage();
    else sfx.play();
    if (duel.over) sfx.win();
    refresh();
  },
  endRound() {
    if (duel.phase === 'table' && !duel.over) {
      wardenTurn(duel);
      if (duel.over) sfx.loss();
      else duel.nextRound();
      refresh();
    } else if (duel.phase === 'title') {
      startGame();
    } else if (duel.phase === 'win' || duel.phase === 'loss') {
      startGame();
    }
  },
  startGame() {
    startGame();
  },
};

if (shot) {
  // Deterministic screenshot frame: stage it, render once, never animate.
  const staged = stageShot(shot, seed);
  duel = staged.duel;
  intent = staged.intent;
  document.body.classList.add('shot-mode');
  renderGame(root, duel, { intent });
  if (duel.phase === 'win') document.body.classList.add('shot-win');
} else {
  bindInput(root, actions);
  refresh();
}
