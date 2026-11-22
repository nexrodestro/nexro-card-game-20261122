// Ember Court — boot and game loop.
// Reads `?shot=title|table|win|loss&seed=N` for deterministic staging
// (screenshots), otherwise opens the title screen for a human player.
// One Game owns the duel, the render and the sounds; input.js drives it.

import { Duel } from './duel.js';
import { wardenIntent } from './warden.js';
import { renderTable, renderTitle, renderWin, renderLoss, drawEmbers } from './render.js';
import { bindInput, runWardenTurn } from './input.js';
import { stageShot } from './shots.js';
import { sound } from './sound.js';

/** The running game: one duel, one stage, one render at a time. */
export class Game {
  constructor() {
    this.duel = new Duel(1);
    this.staged = null;
    this.stage = document.querySelector('#stage');
  }

  /** Start a fresh human duel from the title screen. */
  startDuel() {
    const seed = (Date.now() % 100000) | 0;
    this.duel = new Duel(seed).start();
    this.staged = null;
    sound.play();
    this.render();
  }

  /** Play the player's card at `index`, with sound and a re-render. */
  playPlayerCard(index) {
    if (this.duel.phase !== 'player' || this.duel.winner) return;
    const card = this.duel.player.hand[index];
    if (!card) return;
    const before = this.duel.warden.life;
    const played = this.duel.playCard(this.duel.player, index);
    if (!played) return;
    if (this.duel.surgeCallout) sound.surge();
    else if (played.type === 'Strike' && this.duel.warden.life < before) sound.damage();
    else sound.play();
    this.render();
    this.afterTurn();
  }

  /** End the player's round: the Warden answers, then a new round opens. */
  endRound() {
    if (this.duel.phase !== 'player' || this.duel.winner) return;
    runWardenTurn(this);
  }

  /** After any turn: play the end stinger once, when the duel is over. */
  afterTurn() {
    if (!this.duel.winner) return;
    if (this.duel.winner === 'player') sound.win();
    else sound.loss();
    this.render();
  }

  /** Render the current screen into #stage. */
  render() {
    const duel = this.duel;
    if (duel.phase === 'title' && !this.staged) {
      const { sampleCards } = stageShot('title', 1);
      this.stage.innerHTML = renderTitle(sampleCards);
      return;
    }
    if (duel.winner === 'player') {
      this.stage.innerHTML = renderWin(duel);
      const canvas = this.stage.querySelector('#embers');
      if (canvas) drawEmbers(canvas, duel.seed);
      return;
    }
    if (duel.winner === 'warden') {
      this.stage.innerHTML = renderLoss(duel);
      return;
    }
    const intent = duel.phase === 'player' ? wardenIntent(duel).text : 'The Warden acts…';
    this.stage.innerHTML = renderTable(duel, intent);
  }
}

/** Boot: stage a screenshot frame, or show the title screen. */
export function boot() {
  const game = new Game();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1') || 1;
  if (shot === 'title' || shot === 'table' || shot === 'win' || shot === 'loss') {
    const staged = stageShot(shot, seed);
    game.duel = staged.duel;
    game.staged = shot;
    document.querySelector('#stage').classList.add('staged');
    if (shot === 'title') {
      game.stage.innerHTML = renderTitle(staged.sampleCards);
    } else if (shot === 'table') {
      game.stage.innerHTML = renderTable(staged.duel, staged.intentText);
    } else if (shot === 'win') {
      game.stage.innerHTML = renderWin(staged.duel);
      const canvas = game.stage.querySelector('#embers');
      if (canvas) drawEmbers(canvas, staged.duel.seed);
    } else {
      game.stage.innerHTML = renderLoss(staged.duel);
    }
    document.title = `Ember Court — ${shot}`;
    return game;
  }
  game.render();
  bindInput(game);
  return game;
}

boot();
