// main.js — boot, game loop, animation ticks.
// One clear job: start the game and keep the win flourish alive.
// ?shot=title|table|win|loss&seed=1 stages a deterministic frame;
// without it, the title screen waits for the player.

import { newDuel } from './duel.js';
import { createUI, render } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';
import { sound } from './sound.js';

// Ember particles for the win flourish: fixed seeded positions so a staged
// frame is identical every time; in live play they drift upward with time.
// The canvas bitmap is set to the stage size first — without this, CSS
// scaling blows the 300x150 default bitmap up and the dots turn to blobs.
function drawParticles(canvas, seed, t) {
  if (!canvas) return;
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  let a = (seed * 2654435761) >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 42; i++) {
    const x = rnd() * w;
    const y0 = rnd() * h;
    const size = 2 + rnd() * 5;
    const rise = t === 0 ? 0 : (t / 40 + rnd() * 30) % 120;
    const y = y0 - rise;
    const alpha = Math.max(0, 0.9 - rise / 140);
    ctx.fillStyle = i % 3 === 0 ? `rgba(255, 190, 80, ${alpha})` : `rgba(255, 110, 50, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function boot() {
  const stage = document.querySelector('#stage');
  const ui = createUI(stage);
  window.__emberCourt = { ui, sound };
  bindInput(ui);

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;
  if (shot === 'title' || shot === 'table' || shot === 'win' || shot === 'loss') {
    ui.duel = stageShot(shot, seed);
    render(ui);
    // Staged frames are static. The ember flourish belongs to the win
    // screen only — one fixed burst, no ticking clock.
    if (shot === 'win') drawParticles(document.querySelector('#fx'), seed, 0);
    return;
  }

  ui.duel = newDuel(1);
  render(ui);

  // Live play: one cheap rAF loop that only draws while the win screen is
  // showing — the flourish drifts, everything else stays static.
  let last = 0;
  function tick(now) {
    const duel = ui.duel;
    if (duel && duel.phase === 'over' && duel.winner === 'player') {
      if (now - last > 50) {
        drawParticles(document.querySelector('#fx'), duel.seed, now);
        last = now;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', boot);
