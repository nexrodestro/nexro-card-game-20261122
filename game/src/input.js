// Ember Court — input: mouse clicks and keyboard play.
// Click a card to play it, Enter/Space to end the round, 1–6 to play a
// hand slot. Every action re-renders through the game object.

import { playWardenTurn } from './warden.js';

/** Wire the stage's clicks and keys to the game. `game` owns the duel. */
export function bindInput(game) {
  const stage = document.querySelector('#stage');

  stage.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.in-hand');
    if (cardEl) {
      const index = Number(cardEl.dataset.index);
      game.playPlayerCard(index);
      return;
    }
    if (ev.target.closest('#end-round')) {
      game.endRound();
      return;
    }
    if (ev.target.closest('#play-btn') || ev.target.closest('#play-again')) {
      game.startDuel();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (game.duel.phase !== 'player' || game.duel.winner) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      game.endRound();
      return;
    }
    const slot = Number(ev.key) - 1;
    if (slot >= 0 && slot < game.duel.player.hand.length) {
      game.playPlayerCard(slot);
    }
  });
}

/** One full Warden turn, after the player ends the round. The telegraph
 *  banner already showed the plan; this resolves it, then opens the next
 *  round (or the end screen, if someone hit 0). */
export function runWardenTurn(game) {
  game.duel.endPlayerTurn();
  game.render();
  // A short beat so the player sees the telegraph before the Warden acts.
  setTimeout(() => {
    game.duel.resolveWardenTurn((warden) => playWardenTurn(game.duel));
    game.render();
    game.afterTurn();
  }, 450);
}
