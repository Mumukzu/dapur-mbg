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
export function toggleMute() {
  muted = !muted;
  // silence the BGM instantly too (already-scheduled notes die with the gain)
  if (musicGain) musicGain.gain.value = muted ? 0 : 1;
  return muted;
}

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

// ---------- BGM: an original cheerful kitchen loop (WebAudio only) ----------
// C major, 120 BPM, 8 bars = 16 s loop. Eighth-note melody (triangle) +
// quarter-note bass (sine) + a soft offbeat hat. Volume stays low so the
// SFX (0.1–0.25) always sit clearly on top. No audio files, no network.
const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
  C6: 1046.50,
};
const MUSIC_BPM = 120;
const MUSIC_STEP = 60 / MUSIC_BPM / 2; // one eighth note = 0.25 s
// 64 eighth notes = 8 bars. Original bouncy tune, chords C – F – G – C.
const MUSIC_MELODY = [
  'C5','E5','G5','E5','A5','G5','E5','C5', // bar 1 (C)
  'D5','F5','A5','F5','G5','E5','C5','E5', // bar 2 (F)
  'F5','A5','C6','A5','G5','E5','D5','E5', // bar 3 (G)
  'C5','E5','G5','E5','D5','C5','D5','E5', // bar 4 (C)
  'F5','E5','D5','C5','D5','E5','F5','G5', // bar 5 (F)
  'A5','G5','F5','E5','D5','F5','A5','G5', // bar 6 (C)
  'E5','G5','C6','G5','A5','G5','F5','E5', // bar 7 (G)
  'D5','E5','F5','D5','C5','G4','E4','C4', // bar 8 (C, closing run down)
];
// 32 quarter notes = one bass note per half bar, root-root-fifth-root.
const MUSIC_BASS = [
  'C3','C3','G3','C3', 'F3','F3','C4','F3',
  'G3','G3','D4','G3', 'C3','C3','G3','C3',
  'F3','F3','C4','F3', 'C3','C3','G3','C3',
  'G3','G3','D4','G3', 'C3','G3','C3','C3',
];
const MUSIC_LEN = MUSIC_MELODY.length; // 64 steps per loop

let musicGain = null;   // dedicated BGM bus so mute silences it instantly
let musicTimer = null;  // lookahead scheduler interval
let musicNextTime = 0;  // AudioContext time of the next step to schedule
let musicStep = 0;      // current step inside the 64-step loop
let musicPlaying = false;
let musicPaused = false;
let musicNotes = 0;     // notes scheduled so far (debug / playtest proof)

function musicNote(freq, t0, dur, type, vol) {
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function musicHat(t0) {
  if (!ctx || !musicGain) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * 0.03));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 7000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.02, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
  src.connect(filter).connect(gain).connect(musicGain);
  src.start(t0);
}

// Lookahead scheduler: every 25 ms, schedule every step starting within
// the next 0.15 s. While muted the loop still advances in time (silently),
// so unmuting lands back in the groove instead of replaying the bar.
function scheduleMusic() {
  const ac = ctx;
  if (!ac || !musicPlaying || musicPaused) return;
  if (musicNextTime < ac.currentTime) musicNextTime = ac.currentTime + 0.05; // never burst-schedule after a stall
  while (musicNextTime < ac.currentTime + 0.15) {
    if (!muted) {
      const m = MUSIC_MELODY[musicStep];
      if (m) { musicNote(NOTE[m], musicNextTime, 0.22, 'triangle', 0.07); musicNotes++; }
      if (musicStep % 2 === 0) {
        const b = MUSIC_BASS[musicStep / 2];
        if (b) { musicNote(NOTE[b], musicNextTime, 0.42, 'sine', 0.055); musicNotes++; }
      }
      if (musicStep % 2 === 1) { musicHat(musicNextTime); musicNotes++; }
    }
    musicStep = (musicStep + 1) % MUSIC_LEN;
    musicNextTime += MUSIC_STEP;
  }
}

export function startMusic() {
  const ac = ensureAudio();
  if (!ac || musicPlaying) return false;
  if (!musicGain) {
    musicGain = ac.createGain();
    musicGain.gain.value = muted ? 0 : 1;
    musicGain.connect(ac.destination);
  }
  musicPlaying = true; musicPaused = false;
  musicStep = 0; musicNotes = 0;
  musicNextTime = ac.currentTime + 0.08;
  musicTimer = setInterval(scheduleMusic, 25);
  return true;
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  musicPlaying = false; musicPaused = false;
}

export function pauseMusic() {
  if (!musicPlaying) return;
  musicPaused = true;
}

export function resumeMusic() {
  if (!musicPlaying) return;
  musicPaused = false;
  if (ctx) musicNextTime = ctx.currentTime + 0.08; // resume clean, no catch-up burst
}

export function musicStats() {
  return {
    playing: musicPlaying,
    paused: musicPaused,
    muted,
    notes: musicNotes,
    step: musicStep,
    ctxState: ctx ? ctx.state : 'none',
  };
}
