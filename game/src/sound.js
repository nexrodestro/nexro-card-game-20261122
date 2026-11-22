// Ember Court — sound: tiny WebAudio synth effects, generated in code.
// No audio files, no network. Silent until the first user gesture.
let ctx = null;
let enabled = true;

/** Silence all effects (screenshot mode and quiet play). */
export function setSoundEnabled(on) {
  enabled = on;
}

function audio() {
  if (ctx === null) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** One short oscillator blip: frequency, duration, waveform, gain. */
function blip(freq, dur, type = 'sine', gain = 0.08) {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
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
}

export const sfx = {
  play() {
    blip(520, 0.12, 'triangle', 0.07);
    blip(780, 0.1, 'triangle', 0.05);
  },
  damage() {
    blip(160, 0.2, 'sawtooth', 0.06);
  },
  surge() {
    blip(660, 0.1, 'square', 0.05);
    blip(880, 0.14, 'square', 0.05);
    blip(1320, 0.18, 'square', 0.04);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle', 0.07), i * 120));
  },
  loss() {
    [392, 330, 262].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sine', 0.06), i * 160));
  },
};
