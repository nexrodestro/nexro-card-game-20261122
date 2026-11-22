// Ember Court — tiny WebAudio synth effects, generated in code, no files.
// The context is created lazily on the first user gesture; every call is
// guarded so a browser without audio still plays fine.
let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
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
    // Sound is decoration; a failure here must never break the game.
  }
}

export function playSound(name) {
  if (name === 'play') blip(520, 0.09, 'sine', 0.12);
  else if (name === 'damage') blip(180, 0.16, 'sawtooth', 0.14);
  else if (name === 'guard') blip(300, 0.12, 'sine', 0.12);
  else if (name === 'surge') { blip(660, 0.1, 'triangle', 0.14); setTimeout(() => blip(880, 0.14, 'triangle', 0.14), 90); }
  else if (name === 'start') blip(440, 0.12, 'triangle', 0.12);
  else if (name === 'end') blip(330, 0.08, 'sine', 0.08);
  else if (name === 'win') { blip(523, 0.14, 'triangle', 0.14); setTimeout(() => blip(659, 0.14, 'triangle', 0.14), 120); setTimeout(() => blip(784, 0.22, 'triangle', 0.14), 240); }
}
