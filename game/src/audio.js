// Dapur MBG — every sound is synthesized with WebAudio. No audio files,
// no network: oscillators and filtered noise, built fresh on each call.

let context = null;
let muted = false;
let noiseBuffer = null;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function audioContext() {
  if (context) return context;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

// Warm the audio context on the first user gesture so later sounds play.
export function unlockAudio() {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const length = ctx.sampleRate * 0.5;
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function tone(freq, dur, type, volume, slideTo) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noise(dur, volume, filterFreq, type) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = type || 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + dur + 0.02);
}

export function playSizzle() {
  noise(0.5, 0.16, 5200, 'highpass');
  noise(0.35, 0.1, 2600, 'bandpass');
}

export function playChop() {
  noise(0.09, 0.3, 900, 'lowpass');
  tone(180, 0.07, 'triangle', 0.22, 90);
}

export function playDing() {
  tone(880, 0.35, 'sine', 0.2);
  tone(1318, 0.45, 'sine', 0.14);
}

export function playServePop() {
  tone(520, 0.1, 'square', 0.12, 780);
  tone(1040, 0.22, 'sine', 0.16, 1560);
}

export function playCoin() {
  tone(988, 0.09, 'sine', 0.18);
  tone(1319, 0.2, 'sine', 0.18);
}

export function playTick() {
  tone(1200, 0.05, 'square', 0.07);
}

export function playFail() {
  tone(220, 0.3, 'sawtooth', 0.14, 110);
}

export function playGrab() {
  tone(340, 0.07, 'triangle', 0.14, 460);
}

export function playBurn() {
  noise(0.4, 0.2, 300, 'lowpass');
  tone(140, 0.4, 'sawtooth', 0.12, 70);
}

export function playClick() {
  tone(600, 0.05, 'triangle', 0.1);
}
