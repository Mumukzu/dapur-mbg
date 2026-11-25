// Dapur MBG — the game loop and the state machine:
// title -> playing -> paused -> playing, and playing -> over / complete.
// Mouse clicks are raycast onto the 3D stations; keyboard use goes through
// the same useStation entry point as the mouse. The loop steps the kitchen
// simulation on a fixed 1/60s clock and renders every animation frame.

import { BEST_KEY, STEP } from './config.js';
import { createInput } from './input.js';
import { createOrderBoard } from './orders.js';
import { createGame, startDay, updateKitchen, useStation } from './kitchen.js';
import { buildWorld } from './scene3d.js';
import { createPicker } from './kitchen3d.js';
import { createHud } from './hud.js';
import { createFrameDriver } from './render.js';
import { isMuted, playClick, playTick, setMuted, unlockAudio } from './audio.js';
import { stageShot } from './shots.js';

const stage = document.getElementById('stage');
const world = buildWorld(stage);
const picker = createPicker(world, document.getElementById('labels'));
const hud = createHud();
const drawFrame = createFrameDriver(world, picker, hud);

const input = createInput();
const game = createGame();
game.board = createOrderBoard();
// Exposed for automated playtests and debugging only.
window.__dapurGame = game;
window.__dapurChef = world.chef;
window.__dapurAnchors = picker.anchors;
window.__dapurPicker = picker;
window.__dapurInput = input;
window.__dapurWorld = world;
try {
  game.best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
} catch {
  game.best = 0;
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
let shotMode = false;
if (shotName) {
  shotMode = true;
  stageShot(shotName, game);
  game.screen = 'playing';
}

function saveBest() {
  try {
    localStorage.setItem(BEST_KEY, String(game.best));
  } catch {
    // Best score is a nicety; a blocked store must never break the game.
  }
}

function startShift() {
  unlockAudio();
  startDay(game, Math.random);
  playClick();
}

function handleClick(click) {
  unlockAudio();
  if (game.screen === 'title') { startShift(); return; }
  if (game.screen === 'over' || game.screen === 'complete') { saveBest(); startShift(); return; }
  if (game.screen === 'paused') { game.screen = 'playing'; playClick(); return; }
  const hit = picker.pick(click.x, click.y);
  if (!hit) return;
  playClick();
  useStation(game, hit.station, hit.arg);
}

function handleKeys() {
  if (input.mutePressed) {
    input.mutePressed = false;
    setMuted(!isMuted());
  }
  if (input.pausePressed) {
    input.pausePressed = false;
    if (game.screen === 'playing') game.screen = 'paused';
    else if (game.screen === 'paused') game.screen = 'playing';
  }
  if (input.restartPressed) {
    input.restartPressed = false;
    if (game.screen === 'over' || game.screen === 'complete') {
      saveBest();
      startShift();
    }
  }
  if (input.useSelected && input.selected) {
    input.useSelected = false;
    if (game.screen === 'playing') {
      unlockAudio();
      picker.selected = input.selected;
      if (input.selected !== 'pantry') useStation(game, input.selected);
    }
  } else {
    input.useSelected = false;
  }
  if (input.selected) picker.selected = input.selected;
}

// Canvas clicks feed the same handler as the overlay buttons' clicks.
world.renderer.domElement.addEventListener('pointerdown', (event) => {
  input.mouseX = event.clientX;
  input.mouseY = event.clientY;
  input.clicks.push({ x: event.clientX, y: event.clientY });
});

function bindButton(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}
bindButton('start-btn', startShift);
bindButton('resume-btn', () => { game.screen = 'playing'; playClick(); });
bindButton('retry-btn', () => { saveBest(); startShift(); });
bindButton('again-btn', () => {
  saveBest();
  game.day += 1;
  startShift();
});
bindButton('mute-btn', () => setMuted(!isMuted()));
bindButton('pause-btn', () => {
  if (game.screen === 'playing') game.screen = 'paused';
  else if (game.screen === 'paused') game.screen = 'playing';
});

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  handleKeys();
  while (input.clicks.length) {
    handleClick(input.clicks.shift());
  }
  if (!shotMode && game.screen === 'playing') {
    accumulator += elapsed;
    while (accumulator >= STEP) {
      updateKitchen(game, STEP, Math.random);
      accumulator -= STEP;
      if (game.screen !== 'playing') {
        saveBest();
        break;
      }
    }
    // One tick a second while the shift clock runs low.
    const whole = Math.ceil(game.shiftLeft);
    if (whole !== game.tickSecond) {
      game.tickSecond = whole;
      if (whole <= 10 && whole > 0) playTick();
    }
  }
  drawFrame(game, input, now / 1000);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
