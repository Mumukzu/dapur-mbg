// audio.js — all sound is synthesized with WebAudio. No audio files, no network.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, when = 0, lowpass = 1200) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export function playClick()  { tone(660, 0.07, 'triangle', 0.12); }
export function playPick()   { tone(520, 0.09, 'sine', 0.14); tone(780, 0.1, 'sine', 0.1, 0.06); }
export function playChop()   { noise(0.08, 0.25, 0, 2500); tone(180, 0.06, 'square', 0.08); }
export function playSizzle() { noise(0.5, 0.12, 0, 4000); noise(0.4, 0.08, 0.15, 5000); }
export function playDing()   { tone(880, 0.18, 'sine', 0.16); tone(1318, 0.3, 'sine', 0.12, 0.1); }
export function playServe()  { tone(523, 0.12, 'triangle', 0.16); tone(659, 0.12, 'triangle', 0.16, 0.09); tone(784, 0.22, 'triangle', 0.18, 0.18); }
export function playCoin()   { tone(988, 0.08, 'square', 0.1); tone(1319, 0.16, 'square', 0.1, 0.07); }
export function playFail()   { tone(220, 0.25, 'sawtooth', 0.12, 0, 110); }
export function playTick()   { tone(1200, 0.04, 'square', 0.06); }
export function playStart()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.15, i * 0.09)); }
export function playWin()    { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.16, i * 0.11)); }
export function playFridge() { noise(0.35, 0.1, 0, 800); tone(300, 0.2, 'sine', 0.06, 0, 520); }
