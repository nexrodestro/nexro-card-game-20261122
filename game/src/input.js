// input.js — mouse + keyboard play.
// One clear job: turn clicks and keys into duel calls, then re-render.
// It never decides rules; duel.js does.

import { playCard, endRound, startDuel, newDuel } from './duel.js';
import { wardenAct, planIntent } from './warden.js';
import { render } from './render.js';
import { sound } from './sound.js';

export function bindInput(ui) {
  const stage = ui.stage;

  stage.addEventListener('click', (ev) => {
    const duel = ui.duel;
    if (!duel) return;
    const playBtn = ev.target.closest('#play-btn');
    if (playBtn) {
      sound.play();
      ui.duel = newDuel((Date.now() % 100000) + 7);
      startDuel(ui.duel);
      planIntent(ui.duel);
      ui.prevHandIds = new Set();
      render(ui);
      return;
    }
    const endBtn = ev.target.closest('#end-round');
    if (endBtn && duel.phase === 'play') {
      sound.draw();
      endRound(duel, (d) => wardenAct(d));
      if (duel.phase === 'play') planIntent(duel);
      if (duel.phase === 'over') sound[duel.winner === 'player' ? 'win' : 'lose']();
      render(ui);
      return;
    }
    const cardEl = ev.target.closest('.my-hand .card.playable');
    if (cardEl && duel.phase === 'play') {
      const before = duel.lastSurge;
      const played = playCard(duel, 'player', cardEl.dataset.id);
      if (played) {
        sound.play();
        if (duel.lastSurge && duel.lastSurge !== before) sound.surge();
        if (duel.phase === 'over') sound[duel.winner === 'player' ? 'win' : 'lose']();
        render(ui);
      }
    }
  });

  document.addEventListener('keydown', (ev) => {
    const duel = ui.duel;
    if (!duel || duel.phase !== 'play') return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      document.querySelector('#end-round')?.click();
      return;
    }
    const slot = Number.parseInt(ev.key, 10);
    if (slot >= 1 && slot <= 9) {
      const el = stage.querySelectorAll('.my-hand .card')[slot - 1];
      if (el && el.classList.contains('playable')) el.click();
    }
  });
}
