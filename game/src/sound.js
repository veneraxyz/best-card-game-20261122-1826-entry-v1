// sound.js — WebAudio-synthesised sound effects for EMBER DUEL.
// Oscillator blips only: no audio files, no network. Mute is persisted.

const MUTE_KEY = 'ember-duel-muted';

let ctx = null;
let muted = false;

try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // storage unavailable: mute still applies for this session
  }
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One short oscillator blip.
function blip(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click() {
    blip(660, 0.06, 'square', 0.05);
  },
  play() {
    blip(520, 0.09, 'triangle', 0.12);
    blip(780, 0.09, 'triangle', 0.1, 0.05);
  },
  hit() {
    blip(180, 0.16, 'sawtooth', 0.14);
    blip(90, 0.2, 'square', 0.1, 0.02);
  },
  heal() {
    blip(440, 0.12, 'sine', 0.1);
    blip(660, 0.14, 'sine', 0.09, 0.08);
  },
  shield() {
    blip(300, 0.12, 'triangle', 0.1);
  },
  deny() {
    blip(140, 0.12, 'square', 0.08);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'triangle', 0.12, i * 0.11));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => blip(f, 0.26, 'sawtooth', 0.08, i * 0.13));
  },
};
