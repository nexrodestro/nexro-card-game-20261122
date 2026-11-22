// Ember Court — input: mouse clicks and keyboard play.
// Click a card to play it (keys 1-5 play hand slots), Enter/Space ends the
// round, P starts from the title screen. All handlers are bound once per
// render by main.js; this file only translates events into game actions.
export function bindInput(root, actions) {
  // Bind once: main.js re-renders the stage on every state change, and a
  // second binding would double-fire every click and keypress.
  if (root.dataset.inputBound === '1') return;
  root.dataset.inputBound = '1';
  root.addEventListener('click', (ev) => {
    const card = ev.target.closest('.card.playable');
    if (card && card.dataset.handIndex !== undefined) {
      actions.playCard(Number(card.dataset.handIndex));
      return;
    }
    if (ev.target.closest('#end-round')) {
      actions.endRound();
      return;
    }
    if (ev.target.closest('#play-btn') || ev.target.closest('#again-btn')) {
      actions.startGame();
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key >= '1' && ev.key <= '5') {
      actions.playCard(Number(ev.key) - 1);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      actions.endRound();
    } else if (ev.key === 'p' || ev.key === 'P') {
      actions.startGame();
    }
  });
}
