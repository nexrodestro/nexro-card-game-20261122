// Ember Court — mouse + keyboard input, by delegation on #stage.
// Click a glowing card to play it, Enter/Space to end the round, keys 1-5
// to play hand slots. The game never reads input anywhere else.
export function bindInput(stage, getUi, act) {
  stage.addEventListener('click', (e) => {
    const card = e.target.closest('.my-hand .card.playable');
    if (card) {
      act({ type: 'play', id: card.dataset.id });
      return;
    }
    if (e.target.closest('#end-round')) {
      act({ type: 'end-round' });
      return;
    }
    if (e.target.closest('#play-btn')) {
      act({ type: 'start' });
      return;
    }
    if (e.target.closest('#again-btn')) {
      act({ type: 'restart' });
    }
  });

  document.addEventListener('keydown', (e) => {
    const ui = getUi();
    // Enter/Space on the title or end screen starts a new duel.
    if ((ui.screen === 'title' || ui.screen === 'win' || ui.screen === 'loss')
      && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      act({ type: 'start' });
      return;
    }
    if (ui.screen !== 'table' || !ui.duel || ui.duel.winner) return;
    if (e.key >= '1' && e.key <= '5') {
      const card = ui.duel.player.hand[Number(e.key) - 1];
      if (card) act({ type: 'play', id: card.id });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      act({ type: 'end-round' });
    }
  });
}
