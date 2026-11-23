// sound.js — WebAudio synth effects, generated in code. No audio files.
// One clear job: bleeps. Everything is guarded: no AudioContext, no crash.

let ctx = null;

function audio() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq, dur, type, gain) {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch {
    // Sound is garnish; a blocked context must never break the game.
  }
}

export const sound = {
  // One soft click for selecting a card; a lower thunk for spending ember.
  play() {
    blip(660, 0.09, 'triangle', 0.12);
  },
  spend() {
    blip(330, 0.08, 'square', 0.06);
  },
  draw() {
    blip(520, 0.06, 'sine', 0.08);
  },
  damage() {
    blip(180, 0.16, 'sawtooth', 0.14);
  },
  surge() {
    blip(880, 0.1, 'triangle', 0.12);
    setTimeout(() => blip(1320, 0.14, 'triangle', 0.1), 70);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.12), i * 110));
  },
  lose() {
    [392, 330, 262].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'sine', 0.1), i * 140));
  },
};
