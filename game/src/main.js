// Ember Court — boot: staged screenshot mode (?shot=) or the interactive duel.
// Interactive games seed from the clock; staged shots seed from the URL, so
// the same ?shot=…&seed=… always renders the same frame.
import { newDuel, playCard, endPlayerRound } from './duel.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';
import { playSound } from './sound.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;
const stage = document.querySelector('#stage');

function freshSeed() {
  return (Date.now() % 2147483647) || 1;
}

let ui;
if (shot) {
  // Deterministic staging: freeze animations so the captured frame is stable.
  document.body.classList.add('staging');
  ui = stageShot(shot, seed);
} else {
  ui = { screen: 'title', duel: newDuel(freshSeed()) };
}

function draw() {
  render(stage, ui);
}

function act(a) {
  if (a.type === 'start' || a.type === 'restart') {
    ui = { screen: 'table', duel: newDuel(freshSeed()) };
    playSound('start');
    draw();
    return;
  }
  if (ui.screen !== 'table' || !ui.duel || ui.duel.winner) return;
  if (a.type === 'play') {
    const ev = playCard(ui.duel, 'player', a.id);
    if (ev) {
      const sound = ev.surge ? 'surge'
        : ev.card.type === 'Strike' ? 'damage'
        : ev.card.type === 'Guard' ? 'guard' : 'play';
      playSound(sound);
    }
  } else if (a.type === 'end-round') {
    endPlayerRound(ui.duel);
    playSound('end');
  }
  if (ui.duel.winner) {
    ui.screen = ui.duel.winner === 'player' ? 'win' : 'loss';
    draw();
    if (ui.screen === 'win') playSound('win');
    return;
  }
  draw();
}

bindInput(stage, () => ui, act);
draw();

// Exposed for the headless play-test driver, nothing else reads it.
window.__emberCourt = { get ui() { return ui; } };
