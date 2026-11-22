// Ember Court — sound: tiny WebAudio synth bleeps, generated in code.
// No audio file is ever loaded. Sound is off in staged screenshots and
// whenever the browser has no AudioContext (or the player muted it).

let ctx = null;
let muted = false;

/** Lazily create the shared AudioContext (needs a user gesture first). */
function audio() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** One short oscillator blip: frequency slides from `from` to `to`. */
function blip(from, to, seconds, type = 'sine', gain = 0.12) {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), ac.currentTime + seconds);
    amp.gain.setValueAtTime(gain, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + seconds);
    osc.connect(amp).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + seconds);
  } catch {
    // Sound never breaks the game.
  }
}

export const sound = {
  play() { blip(520, 780, 0.09, 'triangle', 0.1); },
  damage() { blip(220, 90, 0.16, 'sawtooth', 0.08); },
  surge() { blip(440, 880, 0.22, 'triangle', 0.12); blip(660, 1320, 0.22, 'sine', 0.08); },
  win() {
    // A rising four-note stinger: C E G C, one note every 110 ms.
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f * 1.01, 0.3, 'triangle', 0.12), i * 110));
  },
  loss() { blip(330, 110, 0.5, 'sine', 0.1); },
  mute() { muted = true; },
  unmute() { muted = false; },
};
